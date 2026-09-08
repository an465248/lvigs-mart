# AUTH_FIX_REPORT.md — LVIGS Mart

**Updated:** 2026-09-07

---

## SERVICE STATUS

| Service | Status | Detail |
|---------|--------|--------|
| PostgreSQL | PASS | accepting connections on port 5432 |
| Redis | PASS | PONG on port 6379 |
| Backend | PASS | `node dist/src/main.js` PID 23911, listening 0.0.0.0:4000 |
| API Health | PASS | `GET /api/health` → `{"status":"ok","service":"lvigs-mart-api"}` |
| Firebase Admin | PASS | "Firebase Admin initialized with service account file" |
| Frontend | PASS | HTTP 200 on http://localhost:3000 |
| Firebase Web Config | BLOCKED | Web App ID not available locally |

---

## CHANGES MADE

### 1. `frontend/src/lib/api.ts` — Auth header fix (CRITICAL)
**Before:** `firebaseLogin()` and `firebaseSignup()` sent `idToken` in JSON body
**After:** Token sent in `Authorization: Bearer <token>` header (matching `FirebaseAuthGuard`)

### 2. `backend/.env` — Firebase Admin SDK config
**Before:** `FIREBASE_SERVICE_ACCOUNT=""` (empty)
**After:** `FIREBASE_SERVICE_ACCOUNT="/home/gopal/lvigs-mart/backend/firebase.json"`

### 3. `frontend/.env.local` — Firebase web config (5 of 6 values)
**Before:** All `NEXT_PUBLIC_FIREBASE_*` values empty
**After:** Populated from `mobile/android/app/google-services.json`:
- `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB8AleaWa9EtyFNyFY-5ISayOGOruntCBo`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lvigs-mart.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=lvigs-mart`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lvigs-mart.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=667501442669`
- `NEXT_PUBLIC_FIREBASE_APP_ID=` ← **MISSING — must come from Firebase Console**

---

## WHAT'S BLOCKED

**Firebase Web App ID** is required by `frontend/src/lib/firebase.ts` (line 10).
Without it, Firebase SDK logs a warning but phone auth may still work.

### How to fix:
1. Open Firebase Console → lvigs-mart → Project Settings → Your apps
2. Find or create a **Web app** (`</>`)
3. Copy the `appId` (format: `1:667501442669:web:xxxxxxxxxx`)
4. Set in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_APP_ID=<paste here>
   ```
5. Restart frontend dev server

---

## AUTH FLOW (after fix)

```
Frontend                           Backend
  |                                    |
  signInWithPhoneNumber()              |
  → confirmationResult.confirm(otp)    |
  → user.getIdToken() → idToken        |
  |                                    |
  POST /api/auth/firebase/login        |
  Authorization: Bearer <idToken>  →   FirebaseAuthGuard
                                       → verifyIdToken(idToken)
                                       → find/create user
                                       → return JWT
  |                                    |
  localStorage: accessToken            |
  |                                    |
  Cart/Wishlist/Orders                 |
  Authorization: Bearer <jwt>     →   JwtAuthGuard
```

---

## CART / WISHLIST

Already wired to real backend APIs in `api.ts`:
- `GET/POST /api/cart`, `PUT/DELETE /api/cart/:itemId`
- `GET /api/wishlist`, `POST /api/wishlist/toggle/:productId`
- All protected by `JwtAuthGuard` — requires Firebase auth first
