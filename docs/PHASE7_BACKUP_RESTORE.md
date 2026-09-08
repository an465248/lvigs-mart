# PHASE 7 — Backup & Restore

Generated: 2026-09-08

---

## Backup Strategy Overview

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| PostgreSQL | pg_dump | Daily 2 AM | 30 days |
| Redis | RDB + AOF | Continuous | 7 days |
| Files (S3) | S3 Versioning | Continuous | 90 days |
| Configuration | Git | On change | Forever |
| Secrets | Encrypted vault | On change | Forever |

## 1. PostgreSQL Backup

### Manual Backup

```bash
# Full backup
pg_dump -h localhost -U lvigs lvigs_mart | gzip > /opt/lvigs-mart/backups/postgres/lvigs_mart_$(date +%Y%m%d).sql.gz

# Schema only
pg_dump -h localhost -U lvigs --schema-only lvigs_mart > schema.sql

# Data only
pg_dump -h localhost -U lvigs --data-only lvigs_mart | gzip > data.sql.gz
```

### Automated Backup Script

```bash
#!/bin/bash
# /opt/lvigs-mart/scripts/backup-db.sh

set -e

BACKUP_DIR="/opt/lvigs-mart/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30
DB_HOST="localhost"
DB_USER="lvigs"
DB_NAME="lvigs_mart"

mkdir -p $BACKUP_DIR

# Create backup
echo "Starting backup at $(date)"
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Verify backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz | cut -f1)
echo "Backup completed: ${DB_NAME}_${DATE}.sql.gz ($BACKUP_SIZE)"

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "Old backups cleaned (kept $KEEP_DAYS days)"

# Log
echo "$(date): Backup completed - ${DB_NAME}_${DATE}.sql.gz ($BACKUP_SIZE)" >> /var/log/lvigs-backup.log
```

### Cron Job

```bash
# Edit crontab
crontab -e

# Add line (daily at 2 AM)
0 2 * * * /opt/lvigs-mart/scripts/backup-db.sh
```

## 2. Redis Backup

### RDB Snapshot

Redis automatically creates RDB snapshots. Configure in `redis.conf`:

```ini
save 900 1      # Save if at least 1 key changed in 900 seconds
save 300 10     # Save if at least 10 keys changed in 300 seconds
save 60 10000   # Save if at least 10000 keys changed in 60 seconds

dbfilename dump.rdb
dir /data
```

### Manual Redis Backup

```bash
# Trigger RDB save
redis-cli BGSAVE

# Copy dump file
cp /data/dump.rdb /opt/lvigs-mart/backups/redis/dump_$(date +%Y%m%d).rdb
```

### Redis Restore

```bash
# Stop Redis
redis-cli SHUTDOWN NOSAVE

# Copy backup
cp /opt/lvigs-mart/backups/redis/dump.rdb /data/dump.rdb

# Start Redis
redis-server /etc/redis/redis.conf
```

## 3. S3 File Backup

### Enable Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket lvigs-mart \
  --versioning-configuration Status=Enabled
```

### Cross-Region Replication (Optional)

```bash
aws s3api put-bucket-replication \
  --bucket lvigs-mart \
  --replication-configuration '{
    "Role": "arn:aws:iam::ACCOUNT:role/replication-role",
    "Rules": [{
      "Status": "Enabled",
      "Destination": {
        "Bucket": "arn:aws:s3:::lvigs-mart-backup"
      }
    }]
  }'
```

## 4. Restore Procedures

### PostgreSQL Restore

```bash
# Full restore
gunzip lvigs_mart_20260908_020000.sql.gz
psql -h localhost -U lvigs lvigs_mart < lvigs_mart_20260908_020000.sql

# Verify
psql -h localhost -U lvigs lvigs_mart -c "SELECT count(*) FROM products;"
```

### Point-in-Time Recovery (PostgreSQL)

Requires WAL archiving:

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /opt/lvigs-mart/backups/wal/%f'
```

## 5. Backup Verification

```bash
# Test backup integrity
gunzip -t backup_file.sql.gz && echo "Backup OK" || echo "Backup CORRUPT"

# Test restore on staging
psql -h staging-host -U lvigs lvigs_mart_test < backup_file.sql

# Verify row counts
psql -h staging-host -U lvigs lvigs_mart_test -c "
  SELECT 'users' as t, count(*) FROM users
  UNION ALL SELECT 'products', count(*) FROM products
  UNION ALL SELECT 'orders', count(*) FROM orders;
"
```

## 6. Monitoring

### Backup Alerts

```bash
# Check last backup age
find /opt/lvigs-mart/backups/postgres -name "*.sql.gz" -mtime -1 | wc -l

# If 0, backup is overdue - send alert
if [ $(find /opt/lvigs-mart/backups/postgres -name "*.sql.gz" -mtime -1 | wc -l) -eq 0 ]; then
  echo "ALERT: No backup in last 24 hours" | mail -s "LVIGS Backup Alert" admin@YOUR_DOMAIN
fi
```

## 7. Emergency Contacts

| Role | Contact | When |
|------|---------|------|
| Database Admin | YOUR_DBA_EMAIL | Data loss, corruption |
| DevOps | YOUR_DEVOPS_EMAIL | Infrastructure failure |
| Security | YOUR_SECURITY_EMAIL | Data breach |
