# PHASE 7 — Security Hardening

Generated: 2026-09-08

---

## Security Audit Results

### Current Security Status

| Control | Status | Evidence |
|---------|--------|----------|
| Helmet headers | PASS | app.use(helmet()) |
| Rate limiting | PASS | 100 req/min global |
| Input validation | PASS | whitelist + forbidNonWhitelisted |
| CORS | PASS | Configured from WEB_ORIGIN |
| Payment HMAC | PASS | createHmac verification |
| Webhook dedup | PASS | webhookEvent.findUnique |
| Auth guards | PASS | JwtAuthGuard + RolesGuard |
| AI injection | PASS | Blocked by guardrails |
| AI PII | PASS | Blocked by guardrails |
| File upload | PASS | MIME + extension + size |
| Path traversal | PASS | Multer + validation |
| SQL injection | PASS | Prisma parameterized queries |
| XSS | PASS | React escapes by default |
| SSRF | PASS | External URL validation |
| Prompt injection | PASS | Guardrails block attempts |
| PII leakage | PASS | Sensitive fields excluded |

### Security Issues Found

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | Firebase private key in git history | NEEDS_ROTATION |
| 2 | CRITICAL | Google API key in git history | NEEDS_ROTATION |
| 3 | HIGH | Default JWT secrets | CHANGE_FOR_PROD |
| 4 | HIGH | Default DB password | CHANGE_FOR_PROD |
| 5 | MEDIUM | 25+ empty catch blocks | DOCUMENTED |
| 6 | LOW | console.log in startup | ACCEPTABLE |

## Production Security Hardening

### 1. Environment Variables

```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_ACCESS_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For POSTGRES_PASSWORD
```

### 2. Nginx Security Headers

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### 3. Rate Limiting Configuration

```typescript
// Already configured in app.module.ts
ThrottlerModule.forRoot([
  { ttl: 60_000, limit: 100 },   // Global: 100 req/min
]),
{ ttl: 60_000, limit: 20 },      // AI endpoints: 20 req/min
```

### 4. CORS Configuration

```typescript
// Production CORS (main.ts)
app.enableCors({
  origin: process.env.WEB_ORIGIN?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-Id'],
  maxAge: 86400,
});
```

### 5. Database Security

```sql
-- Create limited user for application
CREATE USER lvigs_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT CONNECT ON DATABASE lvigs_mart TO lvigs_app;
GRANT USAGE ON SCHEMA public TO lvigs_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lvigs_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lvigs_app;
```

### 6. Redis Security

```ini
# redis.conf
requirepass YOUR_STRONG_REDIS_PASSWORD
bind 127.0.0.1
protected-mode yes
```

### 7. File Upload Security

Already implemented:
- MIME type validation
- File extension whitelist
- File size limits (10MB)
- Random filename generation
- Path traversal prevention

### 8. API Key Rotation

```bash
# Rotate JWT secrets
NEW_ACCESS=$(openssl rand -hex 32)
NEW_REFRESH=$(openssl rand -hex 32)

# Update .env
sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$NEW_ACCESS/" .env
sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$NEW_REFRESH/" .env

# Restart backend
pm2 restart lvigs-backend
```

### 9. Firebase Security

```bash
# Rotate Firebase private key
# 1. Go to Firebase Console
# 2. Project Settings > Service Accounts
# 3. Generate new private key
# 4. Update FIREBASE_PRIVATE_KEY in .env
# 5. Delete old key from Firebase Console
```

### 10. SSL/TLS

```bash
# Verify SSL configuration
openssl s_client -connect api.YOUR_DOMAIN:443 -servername api.YOUR_DOMAIN

# Check certificate
echo | openssl s_client -connect api.YOUR_DOMAIN:443 2>/dev/null | openssl x509 -noout -text
```

## Security Checklist

### Pre-Production

- [ ] All secrets changed from defaults
- [ ] Firebase private key rotated
- [ ] Google API key rotated
- [ ] JWT secrets are random 64-char strings
- [ ] Database password is strong
- [ ] Redis password is set
- [ ] HTTPS enabled
- [ ] HTTP → HTTPS redirect
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] CORS configured for production domain
- [ ] File upload limits enforced
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React)
- [ ] SSRF prevented
- [ ] Prompt injection blocked
- [ ] PII leakage prevented
- [ ] Admin authorization enforced
- [ ] Webhook signature verification enabled

### Ongoing

- [ ] Monitor for suspicious activity
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually
