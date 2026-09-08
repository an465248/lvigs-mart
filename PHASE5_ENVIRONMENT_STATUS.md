# PHASE 5 ENVIRONMENT STATUS

**Generated:** 2026-09-07

## DETECTED VERSIONS

| Tool | Version | Status |
|------|---------|--------|
| Node.js | v24.19.0 | Available |
| npm | 11.16.0 | Available |
| Git | 2.53.0 | Available |
| Python | 3.13.12 | Available |
| Java | OpenJDK 25.0.4 | Available |
| PostgreSQL (client) | 18.4 | Available |
| Redis (server + CLI) | 8.0.6 | Available |
| Docker | — | NOT INSTALLED |
| Docker Compose | — | NOT INSTALLED |
| Flutter SDK | — | NOT INSTALLED |
| Android SDK | — | NOT INSTALLED |

## SERVICE STATUS

| Service | Status | Details |
|---------|--------|---------|
| PostgreSQL | **DOWN** | Cluster status: "down" (port 5432 not responding). Requires `sudo` to start. |
| Redis | **UP** | Responding to PING on localhost:6379 |
| Backend | **NOT RUNNING** | Can be started with `npm run start:dev` |
| Frontend | **NOT RUNNING** | Can be started with `npm run dev` |
| Docker | **NOT AVAILABLE** | Docker CLI not installed |
| Git Repository | **NOT INITIALIZED** | No `.git` directory in project |

## GIT REMOTE

No git repository initialized. No GitHub remote configured.

## ENVIRONMENT VARIABLES

### Backend (.env)
- All secrets are empty strings or placeholders
- JWT secrets: "change-me-access", "change-me-refresh" (placeholder values)
- No real credentials exposed
- Firebase, Twilio, Razorpay, S3, FCM: all empty

### Frontend
- No `.env` or `.env.local` files exist
- `.env.example` exists with empty Firebase config placeholders
- Firebase config reads from `NEXT_PUBLIC_FIREBASE_*` env vars (not hardcoded)

### Flutter
- `config.dart` defaults to production URL `https://api.lvigs.in/api`
- Can override with `--dart-define=API_BASE_URL=...`
