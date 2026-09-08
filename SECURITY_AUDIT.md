# SECURITY AUDIT — LVIGS Mart

Generated: 2026-09-08

---

## SECRETS IN SOURCE CODE

| Check | Status | Evidence |
|-------|--------|----------|
| API keys in backend source | CLEAN | No matches found |
| API keys in frontend source | CLEAN | No matches found |
| API keys in mobile source | CLEAN | No matches in lib/ |
| Firebase private key | EXPOSED | backend/firebase.json committed (in .gitignore now) |
| Google API key | EXPOSED | mobile/android/app/google-services.json (in .gitignore now) |
| JWT secrets | DEFAULT | "change-me-access" / "change-me-refresh" (dev only) |
| Razorpay secrets | EMPTY | Not configured |
| Database password | DEFAULT | "lvigs" (dev only) |

## SECURITY CONTROLS

| Control | Status | Evidence |
|---------|--------|----------|
| Helmet headers | PASS | app.use(helmet()) in main.ts |
| Rate limiting | PASS | ThrottlerModule 100 req/min |
| Input validation | PASS | whitelist + forbidNonWhitelisted |
| CORS | PASS | Configured from WEB_ORIGIN env |
| Payment HMAC | PASS | 2x createHmac in payments.service.ts |
| Webhook dedup | PASS | webhookEvent.findUnique check |
| Auth guards | PASS | JwtAuthGuard + RolesGuard |
| Unauth → 401 | PASS | Verified on 5 protected endpoints |
| AI injection | PASS | Blocked by guardrails |
| AI PII | PASS | Blocked by guardrails |
| File upload validation | PASS | MIME + extension + size checks |
| Path traversal | PASS | Multer + validation |

## FINDINGS

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | CRITICAL | Firebase private key in git history | NEEDS BFG CLEANUP |
| 2 | CRITICAL | Google API key in git history | NEEDS KEY ROTATION |
| 3 | HIGH | Default JWT secrets | CHANGE FOR PRODUCTION |
| 4 | HIGH | Default DB password | CHANGE FOR PRODUCTION |
| 5 | MEDIUM | Empty catch blocks (25+) | DOCUMENTED |
| 6 | LOW | console.log in startup | ACCEPTABLE |

## RECOMMENDATIONS

1. **ROTATE** Firebase private key immediately
2. **ROTATE** Google API key immediately
3. **CHANGE** JWT secrets for production
4. **CHANGE** database password for production
5. **ADD** Sentry DSN for error tracking
6. **ENABLE** HTTPS in production
