# LVIGS MART FULL RUN STATUS

## Service Status

| Service | Status | Details |
|---|---|---|
| PostgreSQL | **PASS** | v18, running on port 5432, 87 tables, database `lvigs_mart` accessible |
| Redis | **PASS** | Running on port 6379, PONG verified |
| Backend | **PASS** | NestJS 10.3.7 on `0.0.0.0:4000`, all 37 modules loaded |
| Backend LAN access | **PASS** | `http://10.47.26.171:4000/api/health` returns OK |
| CORS | **PASS** | OPTIONS preflight returns 204 with correct headers for `localhost:3000` |
| Products API | **PASS** | `GET /api/products` returns products from database |
| Categories API | **PASS** | `GET /api/products/categories` returns categories with children |
| Brands API | **PASS** | `GET /api/products/brands` returns active brands |
| Banners API | **PASS** | `GET /api/banners/active` returns active banners |
| Search API | **PASS** | `GET /api/search?q=phone` returns search results |
| Search Suggestions | **PASS** | `GET /api/search/suggestions` returns suggestions |
| Trending Searches | **PASS** | `GET /api/search/trending` returns trending terms |
| Pincode Lookup | **PASS** | `GET /api/location/pincode/110001` returns Delhi details |
| Frontend | **PASS** | Next.js 14.2.3 on `http://localhost:3000`, homepage renders |
| Firebase OTP | **NEEDS-CONFIG** | Frontend: Firebase web config empty in `.env.local`. Backend: Firebase Admin SDK env vars empty |
| Android phone | **NOT-CONNECTED** | No physical Android device detected via `flutter devices` |
| Mobile build | **PASS** | `flutter pub get` OK, `flutter analyze` OK (5 info-level only) |
| Admin | **PASS** | Exists at `/admin` (client-side auth with hardcoded credentials) |
| Payment | **NEEDS-RAZORPAY-CONFIG** | `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are empty in backend `.env` |
| Tests | **PASS** | Backend: 8 suites, 62 tests all passing |
| Builds | **PASS** | Backend `nest build` OK, Frontend `next build` OK |

## Critical Blockers

1. **Firebase OTP not configured** — Backend `.env` has empty `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Frontend `.env.local` has empty Firebase web config. Phone OTP flow will not work until these are filled.
2. **Razorpay not configured** — Payment processing will fail. Browsing/cart/login works without it.
3. **Admin/Seller/Delivery auth is client-side only** — Hardcoded credentials, no backend validation. Not a blocker for MVP but a security concern.

## Fixes Applied

1. **Mobile `config.dart`** — Fixed malformed default API URL from `http://10.47.171:4000/api` to `http://10.47.26.171:4000/api`
2. **Backend CORS** — Added `http://127.0.0.1:3000` to allowed origins, added explicit methods and headers list
3. **Backend `.env`** — Updated `WEB_ORIGIN` to include `http://127.0.0.1:3000`
4. **Frontend `backend-api.ts`** — Fixed 6 route mismatches:
   - `/products/slug/{slug}` → `/products/{slug}`
   - `/products/related/{id}/{cat}` → `/products/{id}/related?categoryId={cat}&limit=6`
   - `/payments/create-order` → `/payments/create-order/{orderId}`
   - `/banners` → `/banners/active`
   - `/wishlist` POST → `/wishlist/toggle/{productId}` POST
   - `/reviews` POST → `/reviews/product/{productId}` POST
5. **Frontend `api.ts`** — Fixed synchronous `XMLHttpRequest` in `getTrendingSearches()` to use async `fetch`
6. **Frontend `search/page.tsx` and `SearchPanel.tsx`** — Updated callers of `getTrendingSearches()` to handle async
7. **Frontend `.env.local`** — Created with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`

## Working URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | Frontend (customer web app) |
| `http://localhost:4000/api` | Backend API root |
| `http://localhost:4000/api/health` | Health check |
| `http://localhost:4000/api/products` | Products list |
| `http://localhost:4000/api/products/categories` | Categories |
| `http://localhost:4000/api/products/brands` | Brands |
| `http://localhost:4000/api/banners/active` | Active banners |
| `http://localhost:4000/api/search?q=phone` | Search |
| `http://localhost:4000/api/search/trending` | Trending searches |
| `http://localhost:4000/api/location/pincode/110001` | Pincode lookup |
| `http://localhost:4000/api/docs` | Swagger API docs |
| `http://10.47.26.171:4000/api` | LAN backend (for mobile) |
| `http://10.47.26.171:3000` | LAN frontend |

## Commands to Keep Full Stack Running

```bash
# Start PostgreSQL (requires sudo)
sudo pg_ctlcluster 18 main start

# Start Redis (if not running)
redis-server --daemonize yes

# Start Backend
cd ~/lvigs-mart/backend && node dist/src/main.js

# Start Frontend
cd ~/lvigs-mart/frontend && npx next dev -p 3000

# Mobile (on connected Android device)
cd ~/lvigs-mart/mobile && flutter run --dart-define=API_BASE_URL=http://10.47.26.171:4000/api
```

## What Still Needs External Credentials

| Feature | Required | Where to configure |
|---|---|---|
| Firebase Phone OTP | Firebase project + web config + Admin SDK | Frontend `.env.local` + Backend `.env` |
| Razorpay payments | Razorpay test/live keys | Backend `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) |
| Google OAuth | Google Cloud OAuth client | Backend `.env` |
| S3 uploads | S3-compatible storage credentials | Backend `.env` |
| Push notifications | FCM server key | Backend `.env` |
| Sentry error tracking | Sentry DSN | Backend `.env` + Frontend `.env.local` |
