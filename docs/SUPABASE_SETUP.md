# Supabase Database Setup — LVIGS Mart

Generated: 2026-09-08

---

## 1. Supabase Project Creation

### Steps

1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Enter project details:
   - **Organization**: Select or create
   - **Project name**: `lvigs-mart`
   - **Database password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
5. Click "Create new project"
6. Wait for project to be provisioned (2-3 minutes)

### After Creation

Note these values from the Supabase dashboard:

- **Project URL**: `https://PROJECT_REF.supabase.co`
- **Project ID**: `PROJECT_REF` (from the URL)
- **Database Host**: `aws-0-REGION.supabase.com`
- **Pooler Host**: `aws-0-REGION.pooler.supabase.com`

---

## 2. Required Environment Variables

### In `backend/.env`

```env
# Supabase Connection Pooler (for app runtime)
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres.PROJECT_REF:YOUR_DB_PASSWORD@aws-0-REGION.supabase.com:5432/postgres"
```

### Variable Descriptions

| Variable | Purpose | Used By |
|----------|---------|---------|
| `DATABASE_URL` | Connection pooler (PgBouncer) | App runtime, Prisma queries |
| `DIRECT_URL` | Direct PostgreSQL connection | Migrations, `prisma migrate deploy` |

### Why Two URLs?

- **DATABASE_URL** (pooler): Uses PgBouncer for connection pooling. Better for app runtime with many short-lived connections. Port 6543.
- **DIRECT_URL** (direct): Direct connection to PostgreSQL. Required for migrations because DDL statements cannot go through PgBouncer. Port 5432.

---

## 3. Prisma Connection Configuration

### Schema Update (Already Done)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### How Prisma Uses These

- `url` (DATABASE_URL): Used for all queries (`findMany`, `create`, `update`, etc.)
- `directUrl` (DIRECT_URL): Used for `prisma migrate deploy`, `prisma db push`, `prisma db seed`

### PrismaService (No Changes Needed)

```typescript
// PrismaService connects using DATABASE_URL automatically
// No code changes required
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 4. Migration Strategy

### Recommended: `prisma migrate deploy`

This is the **safest** strategy for this repository because:

1. The project already has 5 Prisma migrations in `prisma/migrations/`
2. These migrations are tracked in `_prisma_migrations` table
3. `prisma migrate deploy` applies only pending migrations in order
4. It respects the migration history

### Steps for Fresh Supabase Database

```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.supabase.com:5432/postgres"

# 2. Generate Prisma client
cd backend
npx prisma generate

# 3. Apply all migrations
npx prisma migrate deploy

# 4. Verify
npx prisma migrate status
```

### What `prisma migrate deploy` Does

- Reads all migration directories in `prisma/migrations/`
- Checks `_prisma_migrations` table for which are applied
- Applies only pending migrations in chronological order
- Marks each as applied in `_prisma_migrations`
- Does NOT create a new migration
- Does NOT reset the database

### Migration Order

```
1. 20260906_add_firebase_uid           (5 lines SQL)
2. 20260907_add_indexes_and_constraints (62 lines SQL)
3. 20260908_phase5_banner_enhancements  (32 lines SQL)
4. 20260908_phase6_advanced_marketplace (47 lines SQL)
```

Total: ~146 lines of SQL across 4 migrations.

### Alternative: `pg_dump` / `pg_restore`

If migrations fail (e.g., due to Supabase-specific PostgreSQL version differences):

```bash
# Dump from local
pg_dump -h localhost -p 5433 -U lvigs lvigs_mart > local_dump.sql

# Restore to Supabase
psql "postgresql://postgres:PASSWORD@aws-0-REGION.supabase.com:5432/postgres" < local_dump.sql
```

**NOT recommended** as first approach — use migrations first.

---

## 5. Local PostgreSQL Fallback

### Current Local Configuration

```env
DATABASE_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"
DIRECT_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"
```

### Switching Between Local and Supabase

**Option A: Environment variable swap**

```bash
# Local
DATABASE_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"
DIRECT_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"

# Supabase
DATABASE_URL="postgresql://postgres.REF:PASS@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.REF:PASS@supabase.com:5432/postgres"
```

**Option B: Separate .env files**

```bash
# For local development
cp .env.local .env

# For Supabase
cp .env.supabase .env
```

**Option C: Use .env.local for local overrides**

`.env.local` is gitignored and can override `.env` for local development.

### Safety Rules

- NEVER commit real Supabase credentials
- NEVER run `prisma migrate reset` on production
- ALWAYS test migrations on staging first
- ALWAYS backup before schema changes

---

## 6. Production Supabase Configuration

### Supabase Settings

| Setting | Value |
|---------|-------|
| Plan | Free tier (500MB database) |
| Connection limit | 60 (free) / 500 (pro) |
| Region | ap-south-1 (Mumbai) |
| SSL | Required |
| Pooler | PgBouncer on port 6543 |

### Connection Pooling

Supabase uses PgBouncer for connection pooling:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Direct Connection (Migrations)

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.supabase.com:5432/postgres
```

### SSL Mode

Supabase requires SSL. Add to connection string if needed:

```
?sslmode=require
```

### Connection Limits

| Plan | Connections | Recommended |
|------|-------------|-------------|
| Free | 60 | Use pooler |
| Pro | 500 | Use pooler for app, direct for migrations |
| Team | 500+ | Use pooler for app, direct for migrations |

---

## 7. Security Requirements

### Do

- [ ] Use strong database password (20+ chars, mixed case, numbers, symbols)
- [ ] Enable SSL for all connections
- [ ] Use connection pooler for app runtime
- [ ] Use direct connection only for migrations
- [ ] Rotate database password periodically
- [ ] Restrict IP access in Supabase dashboard (Settings > Database > Network Restrictions)
- [ ] Enable Row Level Security (RLS) for sensitive tables
- [ ] Use service role key only server-side

### Do Not

- [ ] Never commit DATABASE_URL or DIRECT_URL to git
- [ ] Never expose database credentials to frontend/mobile
- [ ] Never use root user for app runtime
- [ ] Never disable SSL in production
- [ ] Never share credentials in chat/email
- [ ] Never run destructive commands without backup

### Supabase API Keys

Supabase provides two keys:

| Key | Purpose | exposure |
|-----|---------|----------|
| `anon` (public) | Client-side, RLS-enforced | Safe for frontend |
| `service_role` | Server-side, bypasses RLS | NEVER expose to client |

**For LVIGS Mart**: Use `service_role` key server-side only (NestJS backend).

---

## 8. Rollback Procedure

### If Migration Fails

```bash
# 1. Check what failed
npx prisma migrate status

# 2. If partial migration, manually fix in Supabase SQL Editor
# Go to Supabase Dashboard > SQL Editor

# 3. Mark migration as resolved
npx prisma migrate resolve --applied MIGRATION_NAME

# 4. Or mark as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# 5. Re-run
npx prisma migrate deploy
```

### If Supabase Connection Fails

```bash
# 1. Switch back to local
export DATABASE_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"
export DIRECT_URL="postgresql://lvigs:lvigs@localhost:5433/lvigs_mart?schema=public"

# 2. Verify local works
npx prisma migrate status
```

### Complete Rollback to Local

```bash
# 1. Restore local .env
cp .env.local .env

# 2. Restart backend
npm run start:dev
```

---

## 9. Verification Steps

### After Supabase Setup

```bash
# 1. Test direct connection
psql "postgresql://postgres.REF:PASS@supabase.com:5432/postgres" -c "SELECT version();"

# 2. Test pooler connection
psql "postgresql://postgres.REF:PASS@pooler.supabase.com:6543/postgres?pgbouncer=true" -c "SELECT 1;"

# 3. Run migrations
npx prisma migrate deploy

# 4. Verify migration status
npx prisma migrate status

# 5. Generate client
npx prisma generate

# 6. Test Prisma connection
npx prisma db execute --stdin <<< "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"

# 7. Start backend and test health
npm run start:dev
curl http://localhost:4000/api/health/ready
```

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| `connection refused` | Check if Supabase project is active, IP is allowed |
| `password authentication failed` | Verify password, check for special chars in URL encoding |
| `pgbouncer pool timeout` | Increase connection pool size or reduce concurrency |
| `SSL required` | Add `?sslmode=require` to connection string |
| `migration already applied` | Run `npx prisma migrate resolve --applied NAME` |
| `relation already exists` | Database has tables — use `prisma db push` or `pg_dump` |
| `too many connections` | Use connection pooler, reduce `connection_limit` |
