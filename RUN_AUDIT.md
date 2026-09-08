# LVIGS MART - RUN AUDIT

## Project Structure
```
~/lvigs-mart/
  backend/    — NestJS 10.3.7 + Prisma + PostgreSQL + Redis + Firebase Admin
  frontend/   — Next.js 14.2.3 (App Router) + Firebase Auth
  mobile/     — Flutter 3.27.4 + Firebase Auth
```

## Backend
- **Port:** 4000, listens on 0.0.0.0
- **API prefix:** /api
- **ORM:** Prisma 5.14 with PostgreSQL
- **Redis:** ioredis 5.4
- **Firebase Admin:** v14.3 (service account file present at backend/firebase.json)
- **Modules:** 37 feature modules registered
- **Models:** 70+ Prisma models
- **Auth:** JWT + Firebase + Google OAuth + Apple
- **Payments:** Razorpay (credentials empty)
- **Search:** Prisma fallback (OpenSearch optional)
- **CORS:** WEB_ORIGIN env var, defaults to localhost:3000

## Frontend
- **Port:** 3000
- **API client:** src/lib/api.ts (primary) + src/lib/backend-api.ts (secondary, has route mismatches)
- **Auth:** Firebase Phone OTP via signInWithPhoneNumber
- **State:** React Context + localStorage
- **Admin/Seller/Delivery:** Client-side auth only (localStorage flags)
- **No .env.local file** — uses defaults

## Mobile (Flutter)
- **4 screens only:** PhoneLogin, OTP, Home, AddressForm
- **API config bug:** Default URL is `http://10.47.171:4000/api` (missing octet, should be 10.47.26.171)
- **Firebase:** Android configured (google-services.json), iOS missing
- **State management:** None (vanilla setState)

## Critical Route Mismatches (frontend backend-api.ts vs actual backend)

| Frontend URL | Backend Actual | Fix Needed |
|---|---|---|
| `/products/slug/{slug}` | `/products/{slug}` | YES |
| `/products/related/{id}/{cat}` | `/products/{id}/related?categoryId={cat}` | YES |
| `/payments/create-order` (body: orderId) | `/payments/create-order/:orderId` (path param) | YES |
| `/banners` | `/banners/active` | YES |
| `/wishlist` POST (body: productId) | `/wishlist/toggle/:productId` POST | YES |
| `/wishlist/{productId}` DELETE | `/wishlist/toggle/{productId}` POST | YES |
| `/reviews` POST | `/reviews/product/:productId` POST | YES |

## Missing Services
- PostgreSQL: NEEDS-START (user will start manually)
- Redis: RUNNING (PONG verified)
- Flutter: INSTALLED (3.27.4)
