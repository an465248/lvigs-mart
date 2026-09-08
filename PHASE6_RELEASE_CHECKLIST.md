# PHASE 6 RELEASE CHECKLIST — LVIGS Mart

Generated: 2026-09-08

---

## Pre-Release Checklist

### Core Infrastructure
- [x] Backend starts and responds to health checks
- [x] PostgreSQL running with 87 tables, schema up to date
- [x] Redis running and connected
- [x] Queue system operational with retry/backoff
- [ ] OpenSearch configured (currently using PostgreSQL fallback)
- [ ] S3 storage configured (currently using local storage)

### Authentication
- [x] Firebase Admin SDK initialized
- [x] JWT authentication working
- [x] Role-based access control (ADMIN, SELLER, CUSTOMER)
- [x] Unauthenticated requests return 401
- [ ] Live Firebase project for phone OTP
- [ ] Change default JWT secrets for production

### AI & Search
- [x] AI chat endpoint functional (Hindi+English)
- [x] AI guardrails blocking injection and PII
- [x] Voice search with intent extraction
- [x] Image search with upload validation
- [x] Barcode search with safe fallback
- [x] Product comparison endpoint
- [ ] LLM API key for enhanced AI responses

### Commerce
- [x] Product catalog with pagination
- [x] Category management
- [x] Cart with stock validation
- [x] Server-side price calculation
- [x] Order placement with idempotency
- [x] Coupon validation
- [x] Loyalty program
- [x] Membership plans
- [x] Referral system

### Payments
- [x] Razorpay integration code verified
- [x] HMAC signature verification
- [x] Webhook deduplication
- [x] Dev mode auto-verify fallback
- [ ] Sandbox credentials configured

### Frontend
- [x] TypeScript compiles clean (0 errors)
- [x] AI assistant uses real API
- [x] Barcode search uses real API
- [x] Loyalty uses real API
- [x] Membership uses real API
- [x] Referrals uses real API
- [x] Feature flags uses real API
- [x] Categories uses real API
- [ ] Production build verified
- [ ] Admin/seller pages use real API

### Mobile
- [x] API service with 8 Phase 6 methods
- [x] Config with LAN IP fallback
- [x] Android cleartext traffic enabled
- [ ] Flutter SDK installed
- [ ] Build verified
- [ ] Device tested

### Security
- [x] Helmet security headers
- [x] Rate limiting (100 req/min)
- [x] AI rate limiting (20 req/min)
- [x] Input validation (whitelist + forbidNonWhitelisted)
- [x] File upload validation (MIME/extension/size)
- [x] Payment HMAC verification
- [x] Webhook signature verification
- [x] firebase.json in .gitignore
- [ ] Remove firebase.json from git history
- [ ] Change default JWT secrets

### Testing
- [x] 207/207 unit tests passing
- [x] 18/18 E2E smoke tests passing
- [x] TypeScript 0 errors (backend + frontend)
- [ ] Frontend production build
- [ ] Mobile build + test

### Monitoring
- [ ] Sentry DSN configured
- [ ] Health check monitoring
- [ ] Error alerting
- [ ] Performance monitoring

### Deployment
- [ ] Environment variables set
- [ ] Secrets in secrets manager
- [ ] Database migrations applied
- [ ] Redis configured
- [ ] CORS origins configured
- [ ] SSL/TLS certificates
- [ ] Load balancer configured
- [ ] Backup strategy

### Rollback
- [ ] Database backup before migration
- [ ] Previous version deployable
- [ ] Feature flags for gradual rollout
