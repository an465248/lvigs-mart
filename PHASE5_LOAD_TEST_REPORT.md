# LVIGS Mart — Load Test Report Template

**Date:** 2026-09-07
**Tester:** _______________
**Environment:** _______________
**Backend Version:** _______________

---

## 1. Test Scenarios

### Scenario 1: Light Load (100 Concurrent Users)

| Metric | Target | Actual |
|--------|--------|--------|
| Concurrent users | 100 | |
| Duration | 5 minutes | |
| Ramp-up | 30 seconds | |
| Total requests | ~30,000 | |
| Throughput (req/s) | > 100 | |
| p50 latency | < 200ms | |
| p95 latency | < 500ms | |
| p99 latency | < 1000ms | |
| Error rate | < 0.1% | |
| DB connections | < 15 | |
| Redis memory | < 100MB | |

**Endpoints tested:**
- `GET /api/products` — Catalog browse
- `GET /api/products/{slug}` — Product detail
- `GET /api/categories` — Category list
- `GET /api/banners` — Homepage banners
- `POST /api/search` — Search
- `GET /api/cart` — Cart view

### Scenario 2: Medium Load (500 Concurrent Users)

| Metric | Target | Actual |
|--------|--------|--------|
| Concurrent users | 500 | |
| Duration | 10 minutes | |
| Ramp-up | 2 minutes | |
| Total requests | ~150,000 | |
| Throughput (req/s) | > 250 | |
| p50 latency | < 300ms | |
| p95 latency | < 1000ms | |
| p99 latency | < 2000ms | |
| Error rate | < 0.5% | |
| DB connections | < 18 | |
| Redis memory | < 200MB | |

**Endpoints tested:**
- All Scenario 1 endpoints
- `POST /api/orders` — Order placement (with idempotency key)
- `POST /api/cart` — Add to cart
- `GET /api/orders` — Order history

### Scenario 3: Heavy Load (1000 Concurrent Users)

| Metric | Target | Actual |
|--------|--------|--------|
| Concurrent users | 1000 | |
| Duration | 15 minutes | |
| Ramp-up | 3 minutes | |
| Total requests | ~450,000 | |
| Throughput (req/s) | > 400 | |
| p50 latency | < 500ms | |
| p95 latency | < 2000ms | |
| p99 latency | < 5000ms | |
| Error rate | < 1% | |
| DB connections | < 20 | |
| Redis memory | < 256MB | |

**Endpoints tested:**
- All Scenario 2 endpoints
- `POST /api/auth/otp` — OTP request (with rate limiting)
- `GET /api/health/ready` — Health check under load
- WebSocket connections (order tracking)

---

## 2. What to Measure

### Performance Metrics

| Metric | Description | Tool |
|--------|-------------|------|
| **p50 latency** | Median response time | k6 / artillery |
| **p95 latency** | 95th percentile — most users experience this | k6 / artillery |
| **p99 latency** | 99th percentile — worst case for most users | k6 / artillery |
| **Throughput** | Requests served per second | k6 / artillery |
| **Error rate** | Percentage of non-2xx responses | k6 / artillery |
| **Time to first byte (TTFB)** | Time until first response byte | k6 / artillery |

### System Metrics

| Metric | Description | Tool |
|--------|-------------|------|
| **DB connections** | Active PostgreSQL connections | `pg_stat_activity` |
| **DB query count** | Queries per second | `pg_stat_statements` |
| **DB slow queries** | Queries > 1 second | `pg_stat_statements` |
| **Redis memory** | Used memory | `INFO memory` |
| **Redis hit rate** | Cache efficiency | `INFO stats` |
| **Redis evictions** | Keys evicted due to memory | `INFO stats` |
| **CPU usage** | Node.js process CPU | `top` / `htop` |
| **Memory usage** | Node.js heap + RSS | `process.memoryUsage()` |
| **Event loop lag** | Node.js event loop delay | `perf_hooks.monitorEventLoopDelay` |

### Business Metrics

| Metric | Description |
|--------|-------------|
| **Order success rate** | Orders placed / order attempts |
| **Cart add success rate** | Successful cart adds / attempts |
| **Search latency** | Search response time under load |
| **Payment success rate** | Payment completions / payment attempts |
| **Rate limit rejections** | Requests rejected by rate limiter |

---

## 3. How to Run Tests

### k6 (Recommended)

```bash
# Install k6
sudo apt-get install k6  # Ubuntu
# or
brew install k6          # macOS

# Run light load test
k6 run --vus 100 --duration 5m load-test.js

# Run medium load test
k6 run --vus 500 --duration 10m --ramp-up 2m load-test.js

# Run heavy load test
k6 run --vus 1000 --duration 15m --ramp-up 3m load-test.js

# Run with JSON output
k6 run --vus 100 --duration 5m --out json=results.json load-test.js
```

### k6 Test Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },   // Sustained load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:4000/api';

export default function () {
  // Browse products
  let res = http.get(`${BASE_URL}/products?page=1&limit=20`);
  check(res, { 'products status 200': (r) => r.status === 200 });
  latency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  sleep(1);

  // View product detail
  res = http.get(`${BASE_URL}/products/wireless-earbuds`);
  check(res, { 'product detail 200': (r) => r.status === 200 });
  latency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  sleep(1);

  // Search
  res = http.post(`${BASE_URL}/search`, JSON.stringify({ q: 'earbuds' }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'search status 200': (r) => r.status === 200 });
  latency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  sleep(1);
}
```

### artillery

```bash
# Install artillery
npm install -g artillery

# Run test
artillery run --config load-test.yml --output results.json

# Generate report
artillery report results.json
```

```yaml
# load-test.yml
config:
  target: "http://localhost:4000"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Browse products"
    flow:
      - get:
          url: "/api/products?page=1&limit=20"
      - think: 1
      - get:
          url: "/api/products/wireless-earbuds"
      - think: 1
      - post:
          url: "/api/search"
          json:
            q: "earbuds"
```

### Monitoring During Tests

```bash
# Terminal 1: Watch DB connections
watch -n 1 "psql -U lvigs lvigs_mart -c 'SELECT count(*) FROM pg_stat_activity;'"

# Terminal 2: Watch Redis
watch -n 1 "redis-cli INFO stats | grep -E 'keyspace_hits|keyspace_misses|used_memory'"

# Terminal 3: Watch Node.js process
watch -n 1 "ps aux | grep 'node dist' | grep -v grep"

# Terminal 4: Watch logs
tail -f /var/log/lvigs-mart/api.log | jq .
```

---

## 4. Expected Results (Based on Current Architecture)

### With Current Implementation (Phase 5 Fixes Applied)

| Metric | 100 Users | 500 Users | 1000 Users |
|--------|-----------|-----------|------------|
| p50 latency | 80-150ms | 200-400ms | 400-800ms |
| p95 latency | 200-400ms | 500-1500ms | 1500-4000ms |
| p99 latency | 400-800ms | 1000-3000ms | 3000-8000ms |
| Throughput | 150-250 req/s | 300-500 req/s | 400-600 req/s |
| Error rate | < 0.1% | < 0.5% | < 1% |
| DB connections | 8-12 | 12-16 | 16-20 |
| Cache hit rate | 70-80% | 75-85% | 80-90% |

**Assumptions:**
- Prisma `connection_limit=20`
- Redis caching enabled for products, categories, banners, search
- Rate limiting active (100 req/min global, per-endpoint limits)
- Inventory atomic deduction via `$transaction`
- Idempotency keys for order placement
- PostgreSQL on dedicated instance (4 vCPU, 16GB RAM)
- Redis on same instance (256MB limit)

### Bottlenecks Expected

| Load Level | Expected Bottleneck | Mitigation |
|-----------|--------------------| ----------|
| 100 users | None | — |
| 500 users | Search query latency (Prisma `contains`) | Add OpenSearch |
| 500 users | DB connection pool exhaustion | Increase `connection_limit` or add read replica |
| 1000 users | Single NestJS instance CPU | Horizontal scaling (2-3 instances) |
| 1000 users | Redis memory limit (256MB) | Increase to 512MB or add Redis cluster |

---

## 5. Recommendations by Tier

### Tier 1: 100 Concurrent Users (Current Target)

**Infrastructure:**
- 1 NestJS instance (2 vCPU, 2GB RAM)
- 1 PostgreSQL instance (2 vCPU, 8GB RAM)
- 1 Redis instance (128MB)

**Configuration:**
```
connection_limit=15
ThrottlerModule: { ttl: 60000, limit: 100 }
Redis maxmemory: 128mb
```

**Status:** ✅ Achievable with current implementation.

### Tier 2: 500 Concurrent Users

**Infrastructure:**
- 2 NestJS instances (2 vCPU, 2GB RAM each)
- 1 PostgreSQL instance (4 vCPU, 16GB RAM)
- 1 Redis instance (256MB)
- Nginx load balancer

**Configuration:**
```
connection_limit=10 (per instance, 20 total)
ThrottlerModule: { ttl: 60000, limit: 200 }
Redis maxmemory: 256mb
```

**Additional required:**
- [ ] Add OpenSearch for search queries (replace Prisma `contains`)
- [ ] Add Redis adapter for Socket.IO (WebSocket scaling)
- [ ] Move rate limiting to Redis store
- [ ] Add gzip compression in nginx

### Tier 3: 1000 Concurrent Users

**Infrastructure:**
- 3-4 NestJS instances (4 vCPU, 4GB RAM each)
- 1 PostgreSQL primary + 1 read replica (4 vCPU, 16GB RAM each)
- Redis cluster (3 nodes, 512MB each)
- Nginx load balancer with health checks
- BullMQ workers on separate instances

**Configuration:**
```
connection_limit=8 (per instance, 32 total across 4 instances)
ThrottlerModule: { ttl: 60000, limit: 300 }
Redis maxmemory: 512mb per node
```

**Additional required:**
- [ ] PostgreSQL read replica for catalog queries
- [ ] Redis cluster for cache distribution
- [ ] BullMQ for async jobs (notifications, search indexing)
- [ ] CDN for static assets (images, CSS, JS)
- [ ] Structured logging with ELK/Grafana Loki
- [ ] Sentry for error tracking
- [ ] Auto-scaling (Kubernetes HPA or ECS auto-scaling)

---

## 6. Test Results Summary

| Scenario | p50 | p95 | p99 | Throughput | Error Rate | Pass/Fail |
|----------|-----|-----|-----|------------|------------|-----------|
| 100 users | | | | | | |
| 500 users | | | | | | |
| 1000 users | | | | | | |

---

## 7. Issues Found

| # | Scenario | Issue | Severity | Status |
|---|----------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 8. Next Steps

- [ ] Run Scenario 1 (100 users) — baseline
- [ ] Run Scenario 2 (500 users) — identify bottlenecks
- [ ] Run Scenario 3 (1000 users) — stress test
- [ ] Analyze slow queries from `pg_stat_statements`
- [ ] Review Redis hit rates
- [ ] Check event loop lag under load
- [ ] Document findings and update recommendations
- [ ] Plan infrastructure scaling based on results

---

*Report will be updated as tests are executed.*
