# LVIGS Mart — Disaster Recovery Plan

## Overview

This document covers backup strategies, recovery procedures, and data protection for PostgreSQL and Redis in the LVIGS Mart infrastructure.

---

## 1. PostgreSQL Backup Strategy

### 1.1 Logical Backup (pg_dump)

**Schedule:** Daily at 02:00 UTC

```bash
#!/bin/bash
# /opt/scripts/pg-backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="lvigs_mart"
DB_USER="lvigs"
DB_HOST="localhost"

# Full dump with compression
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  -f "${BACKUP_DIR}/lvigs_mart_${TIMESTAMP}.dump"

# Keep last 30 daily backups
find $BACKUP_DIR -name "lvigs_mart_*.dump" -mtime +30 -delete

# Verify backup integrity
pg_restore --list "${BACKUP_DIR}/lvigs_mart_${TIMESTAMP}.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Backup verified: ${BACKUP_DIR}/lvigs_mart_${TIMESTAMP}.dump"
else
  echo "ALERT: Backup verification failed!" | mail -s "LVIGS Backup Alert" ops@lvigsmart.com
fi
```

**Retention:** 30 days of daily dumps.

### 1.2 WAL Archiving (Point-in-Time Recovery)

Enable in `postgresql.conf`:

```ini
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/wal/%f'
max_wal_senders = 3
```

**Recovery to specific timestamp:**

```bash
# Restore base backup
pg_restore -d lvigs_mart /backups/postgres/lvigs_mart_20260901_020000.dump

# Create recovery config
cat > /var/lib/postgresql/data/postgresql.conf <<EOF
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2026-09-06 14:30:00 UTC'
recovery_target_action = 'promote'
EOF

# Restart PostgreSQL
pg_ctl restart
```

### 1.3 Continuous Archiving (Production)

```
Production Setup:
├── Primary PostgreSQL
│   ├── Writes WAL to /archive/wal/
│   └── Ships WAL to S3 via WAL-G or Barman
├── S3 Bucket: lvigs-mart-pg-wal
│   ├── wal/000000010000000000000001
│   ├── wal/000000010000000000000002
│   └── basebackups/20260901/
└── Recovery:
    ├── Restore base backup from S3
    ├── Replay WAL from S3
    └── Promote to primary
```

### 1.4 Backup Monitoring

```bash
# Cron job: alert if no backup in last 25 hours
find /backups/postgres -name "lvigs_mart_*.dump" -mmin -1500 | grep -q .
if [ $? -ne 0 ]; then
  echo "ALERT: No PostgreSQL backup in last 25 hours" | mail -s "LVIGS Backup Alert" ops@lvigsmart.com
fi
```

---

## 2. Redis Backup Strategy

### 2.1 RDB Snapshots

Default Redis configuration:

```ini
# Save if at least 1000 keys changed in 60 seconds
save 60 1000

# Save if at least 100 keys changed in 300 seconds
save 300 100

# Save if at least 1 key changed in 900 seconds
save 900 1
```

**File:** `/var/lib/redis/dump.rdb`

### 2.2 AOF (Append-Only File) for Durability

```ini
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### 2.3 Redis Backup Script

```bash
#!/bin/bash
# /opt/scripts/redis-backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/redis"
REDIS_CLI="redis-cli"

# Trigger RDB snapshot
$REDIS_CLI BGSAVE

# Wait for snapshot to complete
while [ $($REDIS_CLI LASTSAVE) == "$LAST_SAVE" ]; do
  sleep 1
done

# Copy to backup directory
cp /var/lib/redis/dump.rdb "${BACKUP_DIR}/dump_${TIMESTAMP}.rdb"

# Keep last 14 daily backups
find $BACKUP_DIR -name "dump_*.rdb" -mtime +14 -delete
```

**Retention:** 14 days. Redis cache is rebuildable from PostgreSQL, so short retention is acceptable.

### 2.4 Redis Persistence Strategy

| Setting | Value | Rationale |
|---------|-------|-----------|
| `appendonly` | yes | Durability for rate-limit counters, sessions |
| `appendfsync` | everysec | Balance of performance and durability |
| `save` | 60 1000 | Snapshot if 1000+ keys changed in 60s |
| `maxmemory` | 256mb | Prevent OOM |
| `maxmemory-policy` | allkeys-lru | Evict least recently used when full |

---

## 3. Recovery Procedures

### 3.1 PostgreSQL Recovery

#### Scenario: Database Corruption

```bash
# 1. Stop PostgreSQL
systemctl stop postgresql

# 2. Move corrupted data directory
mv /var/lib/postgresql/data /var/lib/postgresql/data_corrupted

# 3. Restore from latest dump
pg_ctl start -D /var/lib/postgresql/data
createdb -U lvigs lvigs_mart
pg_restore -d lvigs_mart /backups/postgres/lvigs_mart_YYYYMMDD_020000.dump

# 4. Verify data integrity
psql -U lvigs lvigs_mart -c "SELECT COUNT(*) FROM \"Order\";"
psql -U lvigs lvigs_mart -c "SELECT COUNT(*) FROM \"Product\";"
```

#### Scenario: Point-in-Time Recovery

```bash
# 1. Stop PostgreSQL
systemctl stop postgresql

# 2. Restore base backup
pg_restore -d lvigs_mart /backups/postgres/lvigs_mart_YYYYMMDD_020000.dump

# 3. Configure recovery target
cat >> /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2026-09-06 14:30:00 UTC'
recovery_target_action = 'promote'
EOF

touch /var/lib/postgresql/data/recovery.signal

# 4. Start PostgreSQL (enters recovery mode)
systemctl start postgresql

# 5. Verify recovery completed
psql -U lvigs lvigs_mart -c "SELECT pg_is_in_recovery();"
# Should return: f (false = primary, recovery complete)
```

### 3.2 Redis Recovery

#### Scenario: Redis Data Loss

```bash
# 1. Stop Redis
systemctl stop redis

# 2. Restore from latest RDB
cp /backups/redis/dump_YYYYMMDD_HHMMSS.rdb /var/lib/redis/dump.rdb
chown redis:redis /var/lib/redis/dump.rdb

# 3. Start Redis
systemctl start redis

# 4. Verify
redis-cli DBSIZE
redis-cli INFO keyspace
```

**Note:** Redis cache is **ephemeral**. If no backup is available:
- Cache is empty — all requests are cache misses
- PostgreSQL serves all data (slower but correct)
- Cache rebuilds automatically as requests arrive

### 3.3 Full Infrastructure Recovery

```bash
#!/bin/bash
# /opt/scripts/full-recovery.sh

echo "=== Step 1: Restore PostgreSQL ==="
systemctl stop postgresql
# ... restore procedure from above

echo "=== Step 2: Restore Redis ==="
systemctl stop redis
# ... restore procedure from above

echo "=== Step 3: Verify Backend ==="
curl -s http://localhost:4000/api/health/ready | jq .
# Expected: { "status": "ok", "checks": { "postgres": "ok", "redis": "ok" } }

echo "=== Step 4: Verify Frontend ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

---

## 4. RPO and RTO Targets

| Metric | Target | How Achieved |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | < 1 hour | Daily pg_dump + WAL archiving |
| **RTO** (Recovery Time Objective) | < 4 hours | Automated restore scripts, recent backup |
| **RPO for Redis** | 0 (loss acceptable) | Cache is rebuildable from PostgreSQL |
| **RTO for Redis** | < 5 minutes | Restart Redis, cache rebuilds automatically |

### RPO/RTO by Component

| Component | RPO | RTO | Strategy |
|-----------|-----|-----|----------|
| PostgreSQL | < 1 hour | < 4 hours | pg_dump + WAL archiving |
| Redis cache | 0 | < 5 minutes | Restart, cache rebuilds |
| Product images (S3) | 0 | < 1 hour | S3 versioning + cross-region replication |
| User sessions | 0 | < 5 minutes | Stored in Redis, rebuild on login |
| Configuration | 0 | < 1 hour | Git repository |

---

## 5. Database Migration Safety

### 5.1 Migration Checklist

```bash
# Before running migrations in production:

# 1. Take backup
pg_dump -F custom -f /backups/pre-migration_$(date +%Y%m%d_%H%M%S).dump lvigs_mart

# 2. Check migration syntax
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource ./migration.sql

# 3. Test on staging first
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 4. Run migration
npx prisma migrate deploy

# 5. Verify
npx prisma db push --force-reset  # NO — destructive!
npx prisma studio  # Visual check
```

### 5.2 Safe Migration Patterns

**Add column (safe):**
```sql
ALTER TABLE "Product" ADD COLUMN "isNewField" TEXT;
```

**Drop column (destructive — use soft delete first):**
```sql
-- Step 1: Add column (deploy code that stops using old column)
ALTER TABLE "Product" ADD COLUMN "deprecated_field_old" TEXT;

-- Step 2: Deploy code that doesn't reference old column

-- Step 3: Drop column (next deploy)
ALTER TABLE "Product" DROP COLUMN "deprecated_field_old";
```

**Add index (safe — use CONCURRENTLY):**
```sql
CREATE INDEX CONCURRENTLY idx_product_new ON "Product" ("newColumn");
```

**Rename column (use add/drop pattern):**
```sql
-- Don't: ALTER TABLE "Product" RENAME COLUMN "old" TO "new";
-- Instead:
ALTER TABLE "Product" ADD COLUMN "new" TEXT;
-- Migrate data
ALTER TABLE "Product" DROP COLUMN "old";
```

### 5.3 Migration Rollback Plan

```bash
# Every migration must have a rollback script

# Forward
npx prisma migrate deploy

# Rollback (if needed)
# Option 1: Restore from backup
pg_restore -d lvigs_mart /backups/pre-migration_YYYYMMDD_HHMMSS.dump

# Option 2: Revert specific migration (if Prisma supports it)
npx prisma migrate reset  # WARNING: destroys all data
```

### 5.4 Zero-Downtime Migrations

1. **Backwards-compatible changes only** — add columns, add indexes
2. **Never rename/remove columns** in same deploy as code change
3. **Use feature flags** for new columns — code reads new column if exists, falls back to old
4. **Deploy code before migration** — code should work with both old and new schema
5. **Run migration after code deploy** — then deploy code that uses new schema

---

## 6. Backup Verification Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| PostgreSQL dump | Daily 02:00 UTC | Automated |
| PostgreSQL dump verify | Weekly (Monday) | ops |
| Redis RDB backup | Daily 03:00 UTC | Automated |
| Full restore test | Monthly | ops |
| WAL archive integrity check | Weekly | ops |
| S3 cross-region replication test | Quarterly | ops |

---

## 7. Emergency Contacts

| Role | Contact | Availability |
|------|---------|-------------|
| Database Admin | ops@lvigsmart.com | 24/7 |
| Backend Lead | lead@lvigsmart.com | Business hours |
| Infrastructure | infra@lvigsmart.com | 24/7 |

---

## 8. Runbooks

### Quick Recovery Checklist

- [ ] Identify failure scope (DB only? Redis? Full?)
- [ ] Take snapshot of current state (for forensics)
- [ ] Execute appropriate recovery procedure
- [ ] Verify via `/api/health/ready`
- [ ] Monitor error rates for 30 minutes
- [ ] Post-incident review within 24 hours
