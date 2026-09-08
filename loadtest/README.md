# Load Testing

## Prerequisites
- Backend running locally (npm run start:dev)
- Node.js 18+

## Usage

```bash
# 50 concurrent users for 30 seconds (safe default)
node load-test.js 50 30

# 100 concurrent users for 30 seconds
node load-test.js 100 30

# 500 concurrent users for 60 seconds
node load-test.js 500 60

# 1000 concurrent users for 30 seconds (use staging only)
node load-test.js 1000 30
```

## Environment Variables
- `API_URL` — Backend URL (default: http://localhost:4000)

## What It Tests
- Health check endpoint
- Product listing
- Category listing
- Brand listing
- Search queries
- Banner loading
- Trending searches

## Metrics Measured
- Total requests
- Requests/second
- Error rate
- p50, p95, p99 latency
- Min/max/avg latency

## WARNING
**NEVER run load tests against production.**
Use only against local or staging environments.
