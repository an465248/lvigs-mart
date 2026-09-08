# LVIGS Mart — Queue Architecture (BullMQ + Redis)

## Overview

LVIGS Mart currently executes all operations synchronously. This document outlines the recommended queue architecture using **BullMQ** backed by Redis to offload heavy, non-blocking work from the API request cycle.

**Current Status:** Queues not yet implemented. All operations are synchronous.

---

## 1. Recommended Queue Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NestJS API                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Orders   │  │ Payments │  │ Products │  ...              │
│  │ Service  │  │ Service  │  │ Service  │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                        │
│       └──────────────┼──────────────┘                        │
│                      │                                      │
│              ┌───────▼────────┐                              │
│              │  BullMQ Queue  │                              │
│              │  Producer      │                              │
│              └───────┬────────┘                              │
└──────────────────────┼──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │     Redis       │
              │  (Queue Broker) │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  BullMQ Workers │
              │  (Separate proc)│
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
   ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
   │ Notification│ │ Search   │ │ Analytics│
   │ Worker     │ │ Indexer  │ │ Worker   │
   └───────────┘ └──────────┘ └──────────┘
```

---

## 2. Queue Names and Purposes

| Queue Name | Purpose | Priority |
|-----------|---------|----------|
| `notifications` | Send push, email, SMS notifications | Medium |
| `search-index` | Index products in search engine | Low |
| `analytics` | Track user events, page views | Low |
| `email` | Send transactional emails | Medium |
| `sms` | Send OTP, order updates via SMS | High |
| `payment-reconciliation` | Reconcile payment gateway status | Medium |
| `inventory-sync` | Sync inventory across warehouses | Medium |
| `image-processing` | Resize/optimize uploaded images | Low |
| `recommendation` | Generate AI recommendations | Low |
| `cleanup` | Clean expired data (sessions, OTPs, idempotency keys) | Low |
| `seller-settlement` | Calculate seller payouts | Medium |
| `fraud-detection` | Run fraud analysis on orders | High |

---

## 3. Job Types and Priorities

### Notifications Queue

```typescript
// Job: send-push-notification
interface PushNotificationJob {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
}

// Job: send-email
interface EmailJob {
  to: string;
  subject: string;
  template: string;  // "order-confirmation", "otp", "password-reset"
  context: Record<string, any>;
}

// Job: send-sms
interface SmsJob {
  to: string;
  message: string;
  priority: 'high' | 'normal';  // OTP = high
}
```

### Search Index Queue

```typescript
// Job: index-product
interface IndexProductJob {
  productId: string;
  action: 'create' | 'update' | 'delete';
}

// Job: reindex-all
interface ReindexAllJob {
  type: 'full' | 'partial';
  categoryIds?: string[];
}
```

### Analytics Queue

```typescript
// Job: track-event
interface TrackEventJob {
  userId?: string;
  sessionId?: string;
  event: string;  // "page_view", "add_to_cart", "purchase"
  properties: Record<string, any>;
  timestamp: string;
}
```

---

## 4. Priority Levels

| Priority | Value | Use Case |
|----------|-------|----------|
| Critical | 1 | Payment webhooks, fraud alerts |
| High | 2 | OTP SMS, order status updates |
| Medium | 3 | Push notifications, email |
| Low | 5 | Search indexing, analytics, image processing |
| Background | 10 | Cleanup jobs, recommendation generation |

```typescript
await notificationsQueue.add('send-push', jobData, {
  priority: 2,  // High
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});
```

---

## 5. Retry Strategy

### Per-Queue Retry Config

| Queue | Max Attempts | Backoff Type | Initial Delay | Max Delay |
|-------|-------------|-------------|---------------|-----------|
| `sms` | 3 | exponential | 2s | 30s |
| `email` | 3 | exponential | 5s | 60s |
| `notifications` | 3 | exponential | 2s | 30s |
| `search-index` | 5 | exponential | 5s | 5min |
| `analytics` | 3 | fixed | 10s | 10s |
| `payment-reconciliation` | 5 | exponential | 10s | 5min |
| `image-processing` | 3 | exponential | 5s | 60s |

### Retry Logic

```typescript
const queue = new Queue('notifications', {
  connection: { host: 'redis-host', port: 6379 },
});

const worker = new Worker('notifications', processJob, {
  connection: { host: 'redis-host', port: 6379 },
  limiter: {
    max: 100,        // Max 100 jobs per interval
    duration: 1000,  // Per second
  },
});

// Per-job retry options
await queue.add('send-push', data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,  // 5s, 10s, 20s
  },
  removeOnComplete: { age: 86400 },  // Keep completed jobs for 24h
  removeOnFail: { age: 604800 },     // Keep failed jobs for 7 days
});
```

---

## 6. Dead Letter Handling

### Dead Letter Queue (DLQ)

Each queue has a corresponding DLQ:

| Queue | DLQ |
|-------|-----|
| `notifications` | `notifications:dead` |
| `sms` | `sms:dead` |
| `email` | `email:dead` |
| `search-index` | `search-index:dead` |

### Processing Dead Letters

```typescript
const deadLetterWorker = new Worker('notifications:dead', async (job) => {
  // Log for manual investigation
  logger.error('Dead letter job', {
    jobId: job.id,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  });

  // Store in database for admin review
  await prisma.deadLetterJob.create({
    data: {
      queue: 'notifications',
      jobId: job.id,
      data: job.data as any,
      error: job.failedReason,
      attempts: job.attemptsMade,
    },
  });
});
```

### Dead Letter Alerting

```typescript
// Monitor DLQ size
const dlqSize = await notificationsDeadQueue.getJobCounts('waiting');
if (dlqSize.waiting > 10) {
  await alertOps(`Notifications DLQ has ${dlqSize.waiting} failed jobs`);
}
```

---

## 7. Worker Concurrency

| Worker | Concurrency | Rationale |
|--------|------------|-----------|
| `notifications` | 5 | External API calls (FCM, email) |
| `sms` | 3 | Rate-limited by Twilio |
| `email` | 5 | SMTP connection pool |
| `search-index` | 2 | CPU-intensive indexing |
| `analytics` | 10 | Simple DB writes |
| `image-processing` | 2 | CPU/GPU-intensive |
| `payment-reconciliation` | 3 | External API calls |
| `cleanup` | 1 | Low priority, batch operations |

```typescript
const worker = new Worker('notifications', processNotification, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 200,
    duration: 1000,  // Max 200 jobs/second
  },
});
```

---

## 8. Implementation Plan

### Phase 1: Core Queues (Week 1)

```bash
# Install dependencies
npm install bullmq ioredis
```

**Files to create:**
```
src/
├── queue/
│   ├── queue.module.ts
│   ├── queue.service.ts          # Queue producer wrapper
│   ├── workers/
│   │   ├── notification.worker.ts
│   │   ├── search-index.worker.ts
│   │   └── analytics.worker.ts
│   └── processors/
│       ├── notification.processor.ts
│       ├── search-index.processor.ts
│       └── analytics.processor.ts
```

### Phase 2: Refactor Existing Services (Week 2)

Move synchronous work to queues:

```typescript
// Before (synchronous)
async placeOrder(userId, dto) {
  const order = await this.prisma.$transaction(...);
  await this.notifications.sendOrderConfirmation(order);  // Blocks!
  return order;
}

// After (async)
async placeOrder(userId, dto) {
  const order = await this.prisma.$transaction(...);
  await this.queue.add('notifications', 'send-order-confirmation', {
    orderId: order.id,
    userId: order.userId,
  });  // Non-blocking
  return order;
}
```

### Phase 3: Advanced Queues (Week 3-4)

- Payment reconciliation
- Fraud detection
- Seller settlement
- Image processing pipeline

---

## 9. Monitoring Queues

### BullMQ Dashboard

```bash
npm install @taskforcesh/bullmq-pro
```

Use [Bull Board](https://github.com/felixmosh/bull-board) for queue monitoring:

```typescript
// queue-dashboard.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(notificationsQueue),
    new BullMQAdapter(smsQueue),
    new BullMQAdapter(searchIndexQueue),
  ],
  serverAdapter,
});
```

### Key Metrics

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Queue waiting count | > 1000 | Scale workers |
| Job processing time (p95) | > 30s | Investigate slow jobs |
| Dead letter count | > 10 | Check failed jobs |
| Worker memory usage | > 500MB | Restart worker |
| Redis memory for queues | > 100MB | Check job retention |

---

## 10. Environment Variables

```bash
# Redis for queues (can be same instance as cache, or separate)
REDIS_QUEUE_URL="redis://redis-queue-host:6379"

# Queue configuration
QUEUE_CONCURRENCY_NOTIFICATIONS=5
QUEUE_CONCURRENCY_SMS=3
QUEUE_CONCURRENCY_EMAIL=5
QUEUE_CONCURRENCY_ANALYTICS=10

# Dead letter alerting
DLQ_ALERT_THRESHOLD=10
DLQ_ALERT_WEBHOOK="https://hooks.slack.com/..."
```

---

## 11. Scaling Workers

### Single Machine

```bash
# Run multiple worker processes
node dist/workers/notification.worker.js &
node dist/workers/notification.worker.js &
node dist/workers/notification.worker.js &
```

### Multiple Machines (Production)

```
┌──────────────────┐     ┌──────────────────┐
│ Worker Machine 1 │     │ Worker Machine 2 │
│ - notifications  │     │ - search-index   │
│ - sms            │     │ - analytics      │
│ - email          │     │ - image-processing│
└──────────────────┘     └──────────────────┘
         │                        │
         └────────┬───────────────┘
                  │
           ┌──────▼──────┐
           │    Redis     │
           │  (Queue Hub) │
           └─────────────┘
```

BullMQ automatically distributes jobs across worker instances using Redis as the coordination point. No manual load balancing needed.
