# LVIGS Mart — Caching Strategy

## Overview

LVIGS Mart uses Redis (via ioredis) with a **cache-aside** pattern. The `CacheService` wraps Redis and provides `get`, `set`, `del`, `getOrSet`, and pattern-based invalidation.

---

## 1. Cache Key Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| `product:{id}` | `product:a1b2c3d4` | Single product by ID |
| `product:slug:{slug}` | `product:slug:wireless-earbuds` | Single product by slug |
| `products:{hash}` | `products:f8a3c1` | Product list (hash of filter params) |
| `product:related:{catId}:{prodId}` | `product:related:cat1:prod2` | Related products |
| `category:{id}` | `category:cat-456` | Single category |
| `category:slug:{slug}` | `category:slug:electronics` | Category by slug |
| `categories:all` | `categories:all` | All categories tree |
| `brands:all` | `brands:all` | All brands |
| `home:banners` | `home:banners` | Active homepage banners |
| `home:categories` | `home:categories` | Homepage category grid |
| `search:{query}` | `search:iphone+15` | Search results |
| `search:suggest:{q}` | `search:suggest:wire` | Autocomplete suggestions |
| `search:trending` | `search:trending` | Trending searches |

### Hash Key Generation

Product list keys use `JSON.stringify(dto)` as hash input:

```typescript
const key = CacheService.keys.products(JSON.stringify(dto));
// dto: { page: 1, limit: 20, category: "electronics", sort: "price_asc" }
// key: products:{"page":1,"limit":20,"category":"electronics","sort":"price_asc"}
```

---

## 2. TTL Values

| Cache Type | TTL | Source |
|-----------|-----|--------|
| Product list (catalog) | 300s (5 min) | `products.service.ts:68` |
| Product detail | 600s (10 min) | `products.service.ts:90` |
| Related products | 300s (5 min) | `products.service.ts:100` |
| Categories tree | 1800s (30 min) | `products.service.ts:110` |
| Category by slug | 1800s (30 min) | `products.service.ts:119` |
| Brands | 1800s (30 min) | `products.service.ts:125` |
| Active banners | 900s (15 min) | `banners.service.ts:28` |
| Search results | 300s (5 min) | `search.service.ts:7` |
| Search suggestions | 600s (10 min) | `search.service.ts:8` |
| Trending searches | 3600s (60 min) | `search.service.ts:9` |

---

## 3. Cache Invalidation Triggers

### On Product Update/Create/Delete

```typescript
// CacheService.invalidateProduct(productId)
async invalidateProduct(productId: string): Promise<void> {
  await this.del(`product:${productId}`);        // Remove single product
  await this.delPattern('products:*');            // Remove all list caches
  await this.del('home:banners');                 // Banners may reference products
  await this.del('home:categories');              // Category counts may change
}
```

### On Category Update

```typescript
// CacheService.invalidateCategory()
async invalidateCategory(): Promise<void> {
  await this.delPattern('category:*');            // All category caches
  await this.del('home:categories');              // Homepage category grid
}
```

### On Banner Update

```typescript
// BannersService.invalidate()
async invalidate(): Promise<void> {
  await this.cache.del(CacheService.keys.homeBanners());
}
```

---

## 4. Cache-Aside Pattern

### How It Works

```
Request → CacheService.getOrSet(key, computeFn, ttl)
                │
                ├── Cache HIT → return cached JSON
                │
                └── Cache MISS → execute computeFn (Prisma query)
                                 → store result in Redis
                                 → return result
```

### Implementation

```typescript
// CacheService.getOrSet()
async getOrSet<T>(key: string, compute: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
  // 1. Try cache
  const cached = await this.get<T>(key);
  if (cached !== null) return cached;

  // 2. Compute from source
  const value = await compute();

  // 3. Store in cache (skip null/undefined)
  if (value !== null && value !== undefined) {
    await this.set(key, value, ttlSeconds);
  }

  return value;
}
```

### Usage Example

```typescript
// ProductsService.getBySlug()
async getBySlug(slug: string) {
  return this.cache.getOrSet(
    CacheService.keys.productBySlug(slug),
    async () => this.prisma.product.findUnique({
      where: { slug, isApproved: true, isActive: true },
      include: { brand: true, category: true, variants: true, images: true },
    }),
    600  // 10 minutes
  );
}
```

---

## 5. What Is Cached vs. What Is NOT Cached

### Cached (Read-Heavy, Write-Light)

| Data | Why |
|------|-----|
| Product catalog listings | High read volume, moderate freshness needs |
| Product detail pages | High read volume |
| Category tree | Rarely changes |
| Brand list | Rarely changes |
| Homepage banners | Campaign-driven, moderate change frequency |
| Search results | Expensive DB queries, high volume |
| Search suggestions | 3 sequential DB queries |
| Trending searches | Very stable |

### Never Cached (Must Be Real-Time)

| Data | Why |
|------|-----|
| Cart contents | Must reflect real-time stock |
| Order status | Financial accuracy |
| Payment status | Financial accuracy |
| Inventory counts | Race condition risk — read from DB only |
| User sessions | Security-sensitive |
| Webhook events | Deduplication requires DB |
| OTP codes | Security-sensitive |
| Coupon usage counts | Race condition risk |

---

## 6. How to Add Caching to New Endpoints

### Step 1: Inject CacheService

```typescript
import { CacheService } from "../../common/cache/cache.service";

@Injectable()
export class MyService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}
}
```

### Step 2: Define Cache Key

```typescript
// Add to CacheService.keys
static keys = {
  // ... existing keys
  myEntity: (id: string) => `my-entity:${id}`,
  myEntityList: (hash: string) => `my-entity:list:${hash}`,
};
```

### Step 3: Wrap Query with getOrSet

```typescript
async findById(id: string) {
  return this.cache.getOrSet(
    CacheService.keys.myEntity(id),
    async () => this.prisma.myEntity.findUnique({ where: { id } }),
    600  // TTL in seconds
  );
}

async list(filters: MyFiltersDto) {
  const hash = JSON.stringify(filters);
  return this.cache.getOrSet(
    CacheService.keys.myEntityList(hash),
    async () => this.prisma.myEntity.findMany({ where: filters }),
    300
  );
}
```

### Step 4: Add Invalidation

```typescript
async update(id: string, data: MyUpdateDto) {
  const result = await this.prisma.myEntity.update({ where: { id }, data });

  // Invalidate single item
  await this.cache.del(CacheService.keys.myEntity(id));
  // Invalidate list caches
  await this.cache.delPattern('my-entity:list:*');

  return result;
}
```

---

## 7. Monitoring Cache Hit Rates

### Redis INFO Command

```bash
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
```

**Hit rate formula:**
```
hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses) × 100%
```

**Target:** > 80% hit rate for product/catalog caches.

### Application-Level Tracking

Add to `CacheService`:

```typescript
async get<T>(key: string): Promise<T | null> {
  try {
    const value = await this.redis.cacheGet<T>(key);
    if (value !== null) {
      this.logger.debug(`Cache HIT: ${key}`);
    } else {
      this.logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  } catch (err) {
    this.logger.warn(`Cache get failed for ${key}: ${err}`);
    return null;
  }
}
```

### Redis Slow Log

```bash
redis-cli SLOWLOG GET 10
```

**Alert threshold:** Any command > 10ms indicates potential Redis performance issue.

### Key Memory Usage

```bash
redis-cli INFO memory
redis-cli DBSIZE
```

**Alert threshold:** `used_memory` > 80% of `maxmemory`.

---

## 8. Cache Failure Handling

All `CacheService` methods catch errors and log warnings — **cache failure never breaks the application**:

```typescript
async get<T>(key: string): Promise<T | null> {
  try {
    return await this.redis.cacheGet<T>(key);
  } catch (err) {
    this.logger.warn(`Cache get failed for ${key}: ${err}`);
    return null; // Graceful degradation — query DB directly
  }
}
```

If Redis is down:
- All reads go directly to PostgreSQL
- Writes still work (invalidation silently fails)
- No 500 errors returned to clients

---

## 9. Eviction Policy

Redis configured with:

```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

When memory limit is reached, Redis evicts least-recently-used keys across all keyspaces. This is safe because:
- All cached data can be recomputed from PostgreSQL
- Hot keys (frequently accessed) stay in cache
- TTL ensures stale data expires even without memory pressure
