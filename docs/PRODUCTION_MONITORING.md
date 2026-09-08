# LVIGS Mart — Production Monitoring Guide

## Overview

This document covers monitoring, logging, alerting, and observability for the LVIGS Mart backend in production.

---

## 1. Structured Logging Format

### Current State

The application uses `console.log` with NestJS `Logger`. For production, implement structured JSON logging.

### Recommended Format

```json
{
  "timestamp": "2026-09-07T12:34:56.789Z",
  "level": "info",
  "message": "Request completed",
  "context": "ProductsController",
  "requestId": "abc123xyz789",
  "method": "GET",
  "path": "/api/products",
  "statusCode": 200,
  "duration": 45,
  "userId": "user-123",
  "ip": "192.168.1.100"
}
```

### Implementation

```typescript
// src/common/logger/json-logger.service.ts
import { LoggerService } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  log(message: string, context?: string, requestId?: string) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      requestId,
    }));
  }

  error(message: string, trace?: string, context?: string, requestId?: string) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      trace,
      context,
      requestId,
    }));
  }

  warn(message: string, context?: string, requestId?: string) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      requestId,
    }));
  }
}
```

### Log Levels

| Level | Use |
|-------|-----|
| `error` | Unhandled exceptions, DB connection failures, payment errors |
| `warn` | Rate limit hits, cache failures, degraded service |
| `info` | Request completion, order placed, payment verified |
| `debug` | Cache hit/miss, query execution, auth token validation |

---

## 2. Request ID Tracking

### How It Works

Every request gets a unique ID via `RequestIdMiddleware`:

```
Client → X-Request-Id: abc123 (optional)
       → Server generates abc123 if not provided
       → X-Request-Id: abc123 (on response)
       → All logs include requestId: abc123
```

### Log Correlation

```json
// All logs for request abc123:
{"requestId":"abc123","level":"info","message":"GET /api/products - incoming"}
{"requestId":"abc123","level":"debug","message":"Cache MISS: products:hash123"}
{"requestId":"abc123","level":"debug","message":"Prisma query: 45ms"}
{"requestId":"abc123","level":"info","message":"GET /api/products 200 - 45ms"}
```

### Usage in Clients

Clients should send `X-Request-Id` header for end-to-end tracing:

```typescript
// Flutter
final response = await http.get(
  Uri.parse('$baseUrl/api/products'),
  headers: {'X-Request-Id': Uuid().v4()},
);

// Next.js
fetch('/api/products', {
  headers: { 'X-Request-Id': crypto.randomUUID() },
});
```

---

## 3. Health Check Usage

### Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Basic ping | `{ "status": "ok" }` |
| `GET /api/health/live` | Liveness probe | `{ "status": "ok" }` |
| `GET /api/health/ready` | Readiness probe | `{ "status": "ok", "checks": { "postgres": "ok", "redis": "ok" } }` |

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lvigs-api
spec:
  template:
    spec:
      containers:
        - name: api
          ports:
            - containerPort: 4000
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /api/health
              port: 4000
            failureThreshold: 30
            periodSeconds: 2
```

### Docker Compose

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

---

## 4. Metrics to Monitor

### Application Metrics

| Metric | Type | Source |
|--------|------|--------|
| Request count | Counter | Middleware |
| Request duration (p50, p95, p99) | Histogram | Middleware |
| Error rate (4xx, 5xx) | Counter | Middleware |
| Active connections | Gauge | NestJS |
| Memory usage (RSS, heap) | Gauge | `process.memoryUsage()` |
| Event loop lag | Gauge | `monitorEventLoopDelay` |
| Active WebSocket connections | Gauge | Socket.IO |

### Database Metrics

| Metric | Type | Source |
|--------|------|--------|
| Connection pool active | Gauge | Prisma |
| Connection pool idle | Gauge | Prisma |
| Query duration (p50, p95, p99) | Histogram | Prisma middleware |
| Slow queries (> 1s) | Counter | pg_stat_statements |
| Deadlocks | Counter | PostgreSQL |
| Transactions per second | Counter | PostgreSQL |
| Cache hit ratio | Gauge | pg_stat_database |

### Redis Metrics

| Metric | Type | Source |
|--------|------|--------|
| Connected clients | Gauge | `INFO clients` |
| Memory used | Gauge | `INFO memory` |
| Keyspace hits | Counter | `INFO stats` |
| Keyspace misses | Counter | `INFO stats` |
| Cache hit rate | Gauge | Calculated |
| Evicted keys | Counter | `INFO stats` |
| Slow commands | Counter | `SLOWLOG GET` |

### Business Metrics

| Metric | Type | Source |
|--------|------|--------|
| Orders per minute | Counter | Order creation events |
| Revenue per hour | Gauge | Payment success events |
| Cart abandonment rate | Gauge | Cart views vs. orders |
| Search queries per minute | Counter | Search endpoint |
| Failed login attempts | Counter | Auth service |
| OTP requests per user | Counter | Auth service |

---

## 5. Alert Thresholds

### Critical (Page immediately)

| Alert | Condition | Action |
|-------|-----------|--------|
| API down | Health check fails 3x | Restart container, page on-call |
| Database unreachable | `pg_isdown` | Failover to replica |
| Redis unreachable | `PING` fails 3x | Restart Redis, check memory |
| Error rate > 5% | 5xx responses / total > 0.05 | Investigate immediately |
| Order failure rate > 1% | Failed orders / total orders > 0.01 | Check inventory, payment |
| Payment webhook failures | > 3 consecutive failures | Check Razorpay status |

### Warning (Notify team)

| Alert | Condition | Action |
|-------|-----------|--------|
| Error rate > 1% | 5xx responses / total > 0.01 | Investigate logs |
| p95 latency > 2s | Request duration p95 > 2000ms | Check slow queries |
| Cache hit rate < 70% | hits / (hits + misses) < 0.7 | Check cache invalidation |
| DB connection pool > 80% | active / connection_limit > 0.8 | Scale connection pool |
| Redis memory > 80% | used_memory / maxmemory > 0.8 | Check eviction rate |
| Disk usage > 80% | PostgreSQL data disk | Archive old data |
| Dead letter queue > 10 | Failed jobs in DLQ | Investigate worker errors |

### Info (Log only)

| Alert | Condition | Action |
|-------|-----------|--------|
| Slow query detected | Query > 1s | Log for review |
| Rate limit hit | Request rejected | Expected behavior |
| Cache miss on hot key | Frequently accessed, not cached | Review TTL |
| New error pattern | First occurrence of error | Log for investigation |

---

## 6. Sentry Integration

### Setup

```bash
npm install @sentry/node
```

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  maxValueLength: 250,
  beforeSend(event) {
    // Don't send health check errors
    if (event.request?.url?.includes('/health')) return null;
    // Don't send rate limit errors
    if (event.exception?.values?.[0]?.type === 'HttpException') return null;
    return event;
  },
});
```

### NestJS Integration

```typescript
// src/common/filters/sentry.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    Sentry.captureException(exception);
    // ... original error handling
  }
}
```

### What to Send to Sentry

| Send | Don't Send |
|------|-----------|
| Unhandled exceptions | 4xx client errors |
| Database connection errors | Rate limit errors |
| Payment processing failures | Health check failures |
| Validation errors (500) | Authentication errors (401) |
| Timeout errors | Cache miss logs |

### Error Context

```typescript
Sentry.setContext('order', {
  orderId: order.id,
  userId: order.userId,
  amount: order.total,
});

Sentry.setUser({
  id: userId,
  email: user.email,
});

Sentry.addBreadcrumb({
  category: 'payment',
  message: 'Payment verification started',
  level: 'info',
});
```

---

## 7. Log Aggregation Architecture

### Production Stack

```
NestJS App → JSON logs to stdout
           → Fluentd/Filebeat (log shipper)
           → Elasticsearch / Loki
           → Grafana (dashboards + alerts)
```

### Alternative: Cloud-Native

```
NestJS App → JSON logs to stdout
           → CloudWatch Logs (AWS)
           → CloudWatch Alarms
           → SNS → Slack / PagerDuty
```

### Log Retention

| Log Type | Retention | Reason |
|----------|-----------|--------|
| Application logs | 30 days | Debugging, audit |
| Access logs | 90 days | Security, analytics |
| Error logs | 180 days | Bug investigation |
| Audit logs | 1 year | Compliance |

---

## 8. Dashboard Overview

### Grafana Dashboard Panels

```
Row 1: Request Overview
├── Request Rate (req/s)
├── Error Rate (%)
├── p50 / p95 / p99 Latency
└── Active Connections

Row 2: Database
├── Query Rate
├── Slow Queries (> 1s)
├── Connection Pool Usage
└── Cache Hit Ratio

Row 3: Redis
├── Memory Usage
├── Keyspace Hit Rate
├── Evicted Keys
└── Connected Clients

Row 4: Business
├── Orders per Minute
├── Revenue per Hour
├── Cart Abandonment Rate
└── Search Volume

Row 5: Infrastructure
├── CPU Usage
├── Memory Usage
├── Disk I/O
└── Network I/O
```

---

## 9. Incident Response

### Severity Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| SEV1 | Complete outage | Immediate |
| SEV2 | Major feature broken | < 30 min |
| SEV3 | Minor feature degraded | < 4 hours |
| SEV4 | Cosmetic / low impact | Next business day |

### Incident Checklist

1. [ ] Acknowledge alert
2. [ ] Check `/api/health/ready` status
3. [ ] Check recent deployments
4. [ ] Check database connectivity
5. [ ] Check Redis connectivity
6. [ ] Check error rates in Sentry
7. [ ] Check logs for root cause
8. [ ] Mitigate (rollback, scale, restart)
9. [ ] Verify recovery
10. [ ] Post-incident review (within 24h)

---

## 10. Monitoring Checklist

- [ ] Structured JSON logging implemented
- [ ] Request ID tracking on all endpoints
- [ ] Health check endpoints (/health, /health/live, /health/ready)
- [ ] Sentry error tracking integrated
- [ ] Log aggregation configured (ELK / Grafana Loki)
- [ ] Alert thresholds defined
- [ ] Dashboard created in Grafana
- [ ] PagerDuty / Slack alerts configured
- [ ] Runbooks documented for common alerts
- [ ] Incident response process defined
