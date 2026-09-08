# API 404 Fix Report

## Root Cause

**`GET /api` was returning 404** because no controller handled the root route.

The NestJS backend has `app.setGlobalPrefix("api")` in `main.ts`, which prefixes all routes with `/api`. However, no controller had a handler for the root `/api` path — all controllers were under sub-paths like `/api/products`, `/api/health`, etc.

## Fix Applied

Created `backend/src/root.controller.ts`:

```typescript
@Controller()
export class RootController {
  @Get()
  root() {
    return {
      name: "LVIGS Mart API",
      version: "1.0",
      status: "ok",
      time: new Date().toISOString(),
      docs: "/api/docs",
      health: "/api/health",
      products: "/api/products",
      search: "/api/search",
      categories: "/api/products/categories",
      brands: "/api/products/brands",
      banners: "/api/banners/active",
    };
  }
}
```

Registered `RootController` in `app.module.ts` imports array.

**Key detail:** The `@Get()` decorator uses no path segment because `setGlobalPrefix("api")` already provides the `/api` prefix. Using `@Get("api")` would have resulted in `/api/api` (double prefix), which was the initial bug in the first attempt.

## Verification (all 200 OK)

| Endpoint | Status | Response |
|----------|--------|----------|
| `GET /api` | 200 | API info JSON with version, endpoints |
| `GET /api/health` | 200 | `{"status":"ok","service":"lvigs-mart-api"}` |
| `GET /api/health/live` | 200 | Liveness probe |
| `GET /api/health/ready` | 200 | Readiness probe (DB, Redis, OpenSearch) |
| `GET /api/products` | 200 | 5 products from PostgreSQL |
| `GET /api/products?collection=trending` | 200 | Trending products |
| `GET /api/products/categories` | 200 | 12 categories |
| `GET /api/products/brands` | 200 | 12 brands |
| `GET /api/banners/active` | 200 | 2 active banners |
| `GET /api/search?q=phone` | 200 | Search results |

## Phone Access

Backend is accessible from Moto G34 5G at `http://10.47.26.171:4000/api`.

- Flutter APK configured with `--dart-define=API_BASE_URL=http://10.47.26.171:4000/api`
- CORS configured for `http://10.47.26.171:3000` (web) and all origins (mobile)
