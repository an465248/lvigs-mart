# LVIGS Mart — Scaling Architecture

## Overview

This document describes the implemented and recommended scaling architecture for the LVIGS Mart backend (NestJS + Prisma + PostgreSQL + Redis).

---

## 1. Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ / NestJS 10 |
| ORM | Prisma 5.14 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (ioredis) |
| Payments | Razorpay |
| Storage | AWS S3 |
| Realtime | Socket.IO |

---

## 2. Connection Pooling

### Prisma `connection_limit`

Configure via `DATABASE_URL` query parameter:

```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

| Instance Type | `connection_limit` | Notes |
|--------------|-------------------|-------|
| Single instance | 20 | Default recommendation |
| 2 instances | 15 each | Leave headroom for migrations |
| 4+ instances | 10 each | Total DB connections must not exceed `max_connections - 5` |

**Rule:** `Σ(connection_limit × instances) < pg max_connections - 5`

### Graceful Shutdown

`PrismaService` implements `OnModuleDestroy` — calls `$disconnect()` on SIGTERM/SIGINT.

---

## 3. Redis Caching Strategy

### Cache Key Naming Convention

```
{entity}:{identifier}:{qualifier}
```

| Pattern | Example |
|---------|---------|
| `product:{id}` | `product:abc-123` |
| `product:slug:{slug}` | `product:slug:wireless-earbuds` |
| `products:{hash}` | `products:a3f8c1` (hash of query params) |
| `category:{id}` | `category:cat-456` |
| `category:slug:{slug}` | `category:slug:electronics` |
| `categories:all` | `categories:all` |
| `brands:all` | `brands:all` |
| `home:banners` | `home:banners` |
| `home:categories` | `home:categories` |
| `search:{hash}` | `search:iphone15` |
| `search:suggest:{q}` | `search:suggest:wire` |
| `search:trending` | `search:trending` |
| `pincode:{pin}` | `pincode:110001` |

### TTL Values

| Cache Type | TTL | Rationale |
|-----------|-----|-----------|
| Product list (catalog browse) | 5 min (300s) | Moderate freshness; high read volume |
| Product detail by slug | 10 min (600s) | Full detail page; less volatile |
| Related products | 5 min (300s) | Changes with inventory |
| Categories / Brands | 30 min (1800s) | Rarely changes |
| Home banners | 15 min (900s) | Campaigns change periodically |
| Search results | 5 min (300s) | Balances freshness with perf |
| Search suggestions | 10 min (600s) | Product list changes less often |
| Trending searches | 60 min (3600s) | Very stable |

### Cache-Aside Pattern

Implemented via `CacheService.getOrSet()`:

```typescript
return this.cache.getOrSet(
  CacheService.keys.productBySlug(slug),
  async () => this.prisma.product.findUnique({ ... }),
  600 // TTL in seconds
);
```

**Flow:**
1. Check Redis for key
2. If hit → return parsed JSON
3. If miss → execute Prisma query → store in Redis with TTL → return

### Cache Invalidation

Triggered on write operations:

```typescript
// Product update
await this.cache.invalidateProduct(productId);

// Category update
await this.cache.invalidateCategory();

// Banner update
await this.cache.del(CacheService.keys.homeBanners());
```

**`invalidateProduct()` clears:**
- `product:{id}`
- `products:*` (all catalog lists)
- `home:banners`
- `home:categories`

**`invalidateCategory()` clears:**
- `category:*`
- `home:categories`

### What is NOT Cached

| Data | Reason |
|------|--------|
| Cart | Per-user, real-time stock validation required |
| Orders | Must be real-time accurate |
| Payment status | Financial integrity |
| Inventory counts | Race condition risk; must read from DB |
| Webhook events | Deduplication requires DB lookup |
| User sessions | Security-sensitive |

---

## 4. Rate Limiting

### Global ThrottlerGuard

```typescript
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])
```

Applied globally via `APP_GUARD`:
```typescript
{ provide: APP_GUARD, useClass: ThrottlerGuard }
```

**Default:** 100 requests per 60 seconds per IP.

### Per-Endpoint RateLimitInterceptor

`RateLimitInterceptor` provides in-memory sliding window per `(ip, handler)`:

```typescript
@UseInterceptors(new RateLimitInterceptor(60_000, 5))
@Post('otp')
sendOtp(@Body() dto: SendOtpDto) { ... }
```

**Recommended per-endpoint limits:**

| Endpoint | Window | Max | Reason |
|----------|--------|-----|--------|
| `POST /auth/otp` | 60s | 5 | Prevent OTP brute force |
| `POST /auth/login` | 300s | 10 | Prevent credential stuffing |
| `POST /orders` | 60s | 10 | Prevent order spam |
| `POST /payments/webhook` | 60s | 100 | Payment gateway retries |
| `GET /products` | 60s | 60 | Catalog browsing |
| `POST /search` | 60s | 30 | Search is expensive |

---

## 5. Health Checks

Three endpoints at `GET /api/health/*`:

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `/health` | Basic ping | None — returns `{ status: "ok" }` |
| `/health/live` | Liveness probe | None — confirms process alive |
| `/health/ready` | Readiness probe | PostgreSQL (`SELECT 1`), Redis (`PING`) |

**Kubernetes usage:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 6. Request ID Tracking

`RequestIdMiddleware` runs on all routes:

- Checks for incoming `X-Request-Id` header
- If absent → generates 12-char nanoid
- Sets `X-Request-Id` on response

```typescript
// Every request gets a unique ID for tracing
req.headers["x-request-id"] = requestId;
res.setHeader("X-Request-Id", requestId);
```

**Usage in logs:**
```json
{"requestId":"abc123xyz","level":"log","message":"GET /api/products 200 - 45ms"}
```

---

## 7. Inventory Concurrency

### Atomic Deduction via `Prisma.$transaction`

```typescript
// orders.service.ts — placeOrder()
await this.prisma.$transaction(async (tx) => {
  for (const item of items) {
    const updateResult = await tx.inventory.updateMany({
      where: {
        id: inventoryRecord.id,
        quantity: { gte: item.quantity }, // Atomic check
      },
      data: {
        quantity: { decrement: item.quantity },
      },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException(`Stock changed for "${item.title}". Please try again.`);
    }

    await tx.inventoryTransaction.create({ ... });
  }
  // ... create order, clear cart, etc.
});
```

**Key properties:**
- `WHERE quantity >= requested` prevents oversell
- `updateMany.count === 0` detects race condition
- Entire operation is atomic (single transaction)
- Rollback on any failure restores stock

---

## 8. Order Idempotency

### IdempotencyKey Table

```prisma
model IdempotencyKey {
  key       String   @unique
  userId    String
  status    String   // PENDING | COMPLETED | FAILED
  response  Json?
  orderId   String?
  expiresAt DateTime
}
```

**Flow:**
1. Client sends `idempotencyKey` in `POST /orders`
2. Server checks if key exists:
   - `COMPLETED` → return stored response (duplicate)
   - `PENDING` → throw 409 Conflict (in progress)
   - `FAILED` → throw 409 Conflict (retry not allowed with same key)
3. Create key with status `PENDING`
4. Process order inside transaction
5. Update key to `COMPLETED` with order response
6. On error → update key to `FAILED`

**Expiry:** 24 hours (`expiresAt`), clean up via daily cron.

---

## 9. Payment Webhook Idempotency

### WebhookEvent Table

```prisma
model WebhookEvent {
  eventId     String   @unique
  provider    String
  eventType   String
  processed   Boolean
  payload     Json?
  processedAt DateTime?
}
```

**Flow (`payments.service.ts:handleWebhook()`):**
1. Verify HMAC signature
2. Look up `eventId` in `WebhookEvent`
3. If `processed === true` → return immediately (skip)
4. Process webhook (update order status inside transaction)
5. Upsert `WebhookEvent` with `processed: true`

**Note:** Duplicate webhooks from Razorpay are safe — they will be deduplicated.

---

## 10. Database Indexes (High-Traffic Patterns)

### Existing Indexes in `schema.prisma`

```prisma
// Product catalog (heavy read)
@@index([categoryId])
@@index([brandId])
@@index([sellerId])
@@index([price])
@@index([rating])
@@index([createdAt])
@@index([title])

// Orders
@@index([userId])
@@index([sellerId])
@@index([status])
@@index([createdAt])

// Notifications (unread count)
@@index([userId, read])

// Search history
@@index([userId, createdAt])

// Product attributes (faceted search)
@@index([key, value])

// Inventory
@@index([productId])
@@index([warehouseId])
@@unique([variantId, warehouseId])
```

### Recommended Additional Indexes

```sql
-- Product catalog filtering (most common query)
CREATE INDEX idx_product_active_approved ON "Product" ("isActive", "isApproved");

-- Price range filtering
CREATE INDEX idx_product_price_active ON "Product" ("price") WHERE "isActive" = true;

-- Order status filtering for dashboards
CREATE INDEX idx_order_status_created ON "Order" ("status", "createdAt" DESC);

-- User events for analytics
CREATE INDEX idx_user_event_type_created ON "UserEvent" ("type", "createdAt" DESC);

-- Idempotency cleanup
CREATE INDEX idx_idempotency_expires ON "IdempotencyKey" ("expiresAt");

-- Webhook event cleanup
CREATE INDEX idx_webhook_created ON "WebhookEvent" ("createdAt");
```

---

## 11. Horizontal Scaling Architecture

```
                    ┌─────────────┐
                    │  Cloud LB   │
                    │ (nginx/ALB) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼─────┐ ┌───▼─────┐
        │ NestJS #1 │ │ NestJS #2│ │ NestJS #N│
        │ (port 4000│ │ (4001)  │ │ (400N)  │
        └─────┬─────┘ └────┬────┘ └────┬────┘
              │             │           │
              └──────┬──────┘───────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL  │
              │  (primary)   │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │    Redis     │
              │  (cluster)   │
              └─────────────┘
```

### Requirements for Multi-Instance

1. **Session storage:** Redis (for JWT refresh token blacklist)
2. **Cache sharing:** All instances hit same Redis
3. **WebSocket:** Sticky sessions or Redis adapter for Socket.IO
4. **File uploads:** S3 (stateless)
5. **Rate limiting:** Redis-backed (replace in-memory `RateLimitInterceptor` with Redis)

### Docker Compose (Production)

```yaml
services:
  api:
    build: ./backend
    replicas: 3
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/lvigs_mart?connection_limit=10
      - REDIS_URL=redis://redis:6379
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    command: >
      postgres
        -c max_connections=100
        -c shared_buffers=256MB
        -c effective_cache_size=768MB

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

---

## 12. Production Environment Variables

```bash
# Database
DATABASE_URL="postgresql://lvigs_user:STRONG_PASSWORD@pg-host:5432/lvigs_mart?connection_limit=15&pool_timeout=10"

# Redis
REDIS_URL="redis://:REDIS_PASSWORD@redis-host:6379"

# Server
PORT=4000
NODE_ENV=production
WEB_ORIGIN="https://lvigsmart.com,https://www.lvigsmart.com"

# JWT
JWT_ACCESS_SECRET="<64-char random>"
JWT_REFRESH_SECRET="<64-char random>"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="30d"

# Firebase
FIREBASE_SERVICE_ACCOUNT="/etc/secrets/firebase.json"

# Razorpay
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."

# S3
S3_ENDPOINT="https://s3.ap-south-1.amazonaws.com"
S3_REGION="ap-south-1"
S3_BUCKET="lvigs-mart-prod"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
LOG_LEVEL="info"
```

---

## 13. Scaling Checklist

- [ ] Set `connection_limit` in `DATABASE_URL` based on instance count
- [ ] Move rate limiting to Redis-backed store for multi-instance
- [ ] Add `RateLimitInterceptor` to auth, order, and payment endpoints
- [ ] Enable PostgreSQL `pg_stat_statements` for query monitoring
- [ ] Set up Redis persistence (RDB + AOF)
- [ ] Configure `max_connections` on PostgreSQL appropriately
- [ ] Add nginx upstream with health checks
- [ ] Enable gzip compression in nginx
- [ ] Set cache headers for static assets
- [ ] Configure Socket.IO Redis adapter for WebSocket scaling
- [ ] Set up log aggregation (ELK/Grafana Loki)
- [ ] Add Sentry for error tracking
