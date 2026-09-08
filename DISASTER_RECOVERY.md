# LVIGS Mart — Disaster Recovery & Backup Guide

## Overview

This document outlines the backup and disaster recovery procedures for LVIGS Mart.

## Recovery Point Objective (RPO)

| Component | RPO |
|-----------|-----|
| PostgreSQL | 5 minutes (WAL archiving) |
| Redis | Best effort (in-memory) |
| S3/Media | Durability: 99.999999999% (S3) |
| Environment Config | Version controlled |

## Recovery Time Objective (RTO)

| Component | RTO |
|-----------|-----|
| PostgreSQL | 15 minutes |
| Redis | 5 minutes |
| Backend | 10 minutes |
| Frontend | 5 minutes |

## 1. PostgreSQL Backup

### Automated Daily Backup

```bash
# Create backup
pg_dump -U lvigs -d lvigs_mart -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore from backup
pg_restore -U lvigs -d lvigs_mart --clean backup_20260908.dump
```

### Docker-based Backup

```bash
# Backup
docker exec lvigs-mart-postgres pg_dump -U lvigs lvigs_mart > backup.sql

# Restore
cat backup.sql | docker exec -i lvigs-mart-postgres psql -U lvigs lvigs_mart
```

### Point-in-Time Recovery

1. Enable WAL archiving in PostgreSQL
2. Configure `archive_mode = on`
3. Set `archive_command` to copy WAL files to backup location
4. Use `pg_basebackup` for base backups

## 2. Redis Backup

Redis is used for caching only. Data loss is acceptable.

```bash
# Save Redis data
docker exec lvigs-mart-redis redis-cli BGSAVE

# Copy dump.rdb
docker cp lvigs-mart-redis:/data/dump.rdb ./redis-backup/
```

## 3. S3/Media Backup

- S3 has built-in redundancy (99.999999999%)
- Enable S3 versioning for additional protection
- Cross-region replication for critical assets

## 4. Environment Secrets Backup

```bash
# Backup environment files (encrypted)
gpg -c .env
gpg -c backend/.env
gpg -c frontend/.env.local
```

## 5. Database Migration Recovery

```bash
# If migration fails, rollback
npx prisma migrate reset

# Reapply migrations
npx prisma migrate deploy

# If schema is corrupted
npx prisma db push --force-reset
```

## 6. Full System Restore

### Step 1: Restore Infrastructure
```bash
docker-compose down
docker-compose up -d postgres redis
```

### Step 2: Restore Database
```bash
cat backup.sql | docker exec -i lvigs-mart-postgres psql -U lvigs lvigs_mart
```

### Step 3: Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

### Step 4: Restart Services
```bash
docker-compose up -d
```

## 7. Rollback Procedure

### Code Rollback
```bash
# Revert to previous version
git checkout <previous-tag>
docker-compose build
docker-compose up -d
```

### Database Rollback
```bash
# Create reverse migration
npx prisma migrate dev --create-only --name rollback_phase5

# Apply rollback
npx prisma migrate deploy
```

## 8. Monitoring & Alerts

- Monitor PostgreSQL replication lag
- Monitor Redis memory usage
- Monitor API response times
- Set up alerts for:
  - Database connection failures
  - High error rates
  - Memory exhaustion
  - Disk space low

## 9. Testing Recovery

Run quarterly disaster recovery drills:
1. Simulate database failure
2. Test backup restoration
3. Verify data integrity
4. Measure actual RTO vs target
