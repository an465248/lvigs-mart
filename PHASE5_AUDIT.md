# PHASE 5 AUDIT — LVIGS Mart Scalability & High-Traffic Readiness

**Date:** 2026-09-07
**Auditor:** opencode
**Status:** AUDIT COMPLETE — Implementation In Progress

---

## 1. CURRENT ARCHITECTURE

### Stack
| Layer | Technology | Status |
|-------|-----------|--------|
| Mobile App | Flutter (Dart) | Scaffold — 5 screens, 2 services, no state management |
| Web Frontend | Next.js 14 + Tailwind | Full UI — 53 pages, mock API (no backend integration) |
| Backend API | NestJS + Prisma ORM | 28 modules, 32 services, 30 controllers |
| Database | PostgreSQL via Prisma | 80+ models, 1903-line schema |
| Cache | Redis (ioredis) | Basic get/set/cacheGet/cacheSet, minimal usage |
| Auth | Firebase Phone Auth + JWT + Passport | Complete |
| Payments | Razorpay | createOrder, verifyPayment, webhook handler |
| Search | Prisma `contains` queries (no search engine) | OpenSearch URL in .env but not implemented |
| Storage | AWS S3 | Upload service present |
| Real-time | Socket.IO (tracking gateway) | Order tracking |
| Queues | NONE | No BullMQ/Bull implementation |
| Docker | NONE | No Dockerfile, no docker-compose |
| CI/CD | NONE | No GitHub Actions |
| Monitoring | NONE | No Sentry, no structured logging |
| Load Balancer | NONE | Single instance only |

### Deployment
- Backend: Single NestJS instance on port 4000
- Frontend: Next.js on port 3000
- Mobile: Hardcoded IP `10.47.26.171:4000`
- Database: PostgreSQL (connection string in env)
- Redis: localhost:6379

---

## 2. CURRENT SCALING CAPABILITY

| Aspect | Current State | Risk Level |
|--------|--------------|------------|
| Concurrent users | ~50 safe, issues at 100+ | HIGH |
| Product catalog | ~1000 safe, issues at 10K+ | MEDIUM |
| Orders/day | ~100 safe, issues at 1000+ | HIGH |
| Inventory accuracy | Race condition under concurrency | CRITICAL |
| Search performance | Full table scan with LIKE | HIGH |
| API response time | No caching, repeated DB queries | HIGH |
| Memory usage | No connection pooling config | MEDIUM |
| Error recovery | No graceful degradation | MEDIUM |

---

## 3. IDENTIFIED BOTTLENECKS

### CRITICAL (Must Fix)
1. **Inventory race condition** — `orders.service.ts:placeOrder()` reads cart, creates order, but NEVER deducts inventory. No atomic stock check/deduction. Concurrent purchases can oversell.
2. **No idempotency** — Order creation has no idempotency key. Client retry creates duplicate orders. `shortId` uses `Math.random()` — collision at scale.
3. **Webhook not idempotent** — `payments.service.ts:handleWebhook()` has no duplicate event protection. Same webhook processed multiple times.
4. **No connection pooling** — Prisma uses default connection limits. High traffic exhausts PostgreSQL connections.

### HIGH
5. **N+1 queries** — `cart.service.ts:getCart()` loads all items with products. `orders.service.ts:getOrders()` loads items + product images for each. No `select` optimization.
6. **Search full table scan** — `search.service.ts` uses Prisma `contains` with `mode: "insensitive"` — PostgreSQL sequential scan on every search request.
7. **No Redis caching** — Product list, category list, home page banners — all hit DB every request.
8. **No rate limiting per endpoint** — Global 100 req/min. Auth endpoints need stricter limits. OTP abuse possible.
9. **No background jobs** — Notifications, search indexing, analytics — all synchronous, block event loop.
10. **Search N+1** — `search.service.ts:suggestions()` makes 3 sequential DB queries (products, categories, brands).

### MEDIUM
11. **No health checks** — Only basic `GET /health`. No readiness/liveness probes.
12. **No structured logging** — `console.log` only. No request IDs, no latency tracking.
13. **No compression** — Large API responses not compressed.
14. **Flutter hardcoded URL** — `http://10.47.26.171:4000/api` — breaks in production.
15. **No pagination limits enforcement** — Products page limit capped at 100 but could be optimized.
16. **Category tree loading** — `getCategories()` loads all categories + children in one query — fine for small catalog, needs caching at scale.

---

## 4. DATABASE RISKS

| Table | Risk | Issue |
|-------|------|-------|
| Product | HIGH | No index on `isActive+isApproved` composite. Every product list query scans full table. |
| Product | HIGH | `stock` column on Product table — inventory should be in Inventory table only. |
| Order | HIGH | `shortId` collision risk with `Math.random()` |
| CartItem | MEDIUM | No stock validation on add/update |
| Inventory | CRITICAL | No atomic deduction. Race condition. |
| Coupon | HIGH | `usedCount` increment not atomic. Race condition. |
| Notification | MEDIUM | No index on `userId+read` for unread count |
| UserEvent | MEDIUM | High-volume table, needs partitioning at scale |
| AuditLog | MEDIUM | High-volume table, needs retention policy |

---

## 5. API RISKS

| Endpoint | Risk | Issue |
|----------|------|-------|
| POST /orders | CRITICAL | No idempotency key. Duplicate orders on retry. |
| POST /payments/webhook | HIGH | No duplicate webhook protection. |
| GET /products | HIGH | No caching. DB hit on every request. |
| GET /search | HIGH | Full table scan with LIKE. |
| POST /cart | MEDIUM | No stock validation. |
| POST /auth/otp | HIGH | No rate limiting. OTP brute force possible. |
| GET /home | HIGH | Multiple sequential DB queries. |

---

## 6. REDIS RISKS

| Risk | Issue |
|------|-------|
| No cache invalidation strategy | Stale data served after product updates |
| No TTL on cache keys | Memory exhaustion |
| No fallback on Redis failure | App crashes if Redis is down |
| No cache stampede protection | Thundering herd on hot keys |

---

## 7. QUEUE RISKS

**No queues implemented.** All heavy operations are synchronous:
- Notification sending (blocks order creation response)
- Search indexing (blocks product updates)
- Analytics events (blocks user actions)
- Email/SMS (blocks auth flow)

---

## 8. SEARCH RISKS

| Risk | Issue |
|------|-------|
| Full table scan | `LIKE '%query%'` on 10K+ products = seconds |
| No caching | Same search query hits DB every time |
| No fallback | Search failure = no results |
| No typo tolerance | Users must type exact match |
| No autocomplete | Suggestion endpoint is sequential 3-query |

---

## 9. STORAGE/CDN RISKS

| Risk | Issue |
|------|-------|
| S3 configured but minimal usage | Product images may not use CDN |
| No image optimization | Full-size images served everywhere |
| No cache headers | Browser re-downloads on every visit |

---

## 10. FLUTTER/WEB PERFORMANCE RISKS

| Risk | Issue |
|------|-------|
| Flutter: No state management | Every screen rebuilds fully |
| Flutter: No image caching | Network images downloaded repeatedly |
| Flutter: Hardcoded API URL | Breaks in production |
| Web: Mock API only | No real backend integration |
| Web: No lazy loading | All products loaded upfront |

---

## 11. INFRASTRUCTURE RISKS

| Risk | Issue |
|------|-------|
| No Docker | No reproducible builds |
| No CI/CD | Manual deployment, no automated testing |
| No load balancer | Single instance, no failover |
| No auto-scaling | Fixed capacity |
| No backups documented | Data loss risk |

---

## 12. RECOMMENDED CHANGES (Priority Order)

### Phase 5.1 — CRITICAL (Data Integrity)
1. Fix inventory concurrency with atomic PostgreSQL transactions
2. Fix order idempotency with idempotency keys
3. Fix webhook idempotency with event dedup
4. Fix shortId collision with nanoid
5. Fix coupon race condition with atomic increment

### Phase 5.2 — HIGH (Performance)
6. Add Prisma connection pooling config
7. Add Redis caching for hot paths (products, categories, banners, search)
8. Add composite indexes for frequent query patterns
9. Fix N+1 queries in cart, orders, products
10. Parallelize search suggestions

### Phase 5.3 — HIGH (Traffic Management)
11. Add endpoint-specific rate limiting
12. Add BullMQ queue system for async jobs
13. Add compression middleware
14. Add health check endpoints (ready/live)

### Phase 5.4 — MEDIUM (Operations)
15. Add structured logging with request IDs
16. Add Docker + docker-compose
17. Add basic CI/CD
18. Fix Flutter hardcoded URL
19. Add documentation

---

*This audit will be updated as implementation progresses.*
