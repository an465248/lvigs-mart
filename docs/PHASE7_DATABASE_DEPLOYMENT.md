# PHASE 7 — Database Deployment

Generated: 2026-09-08

---

## Production PostgreSQL Setup

### Option 1: Docker (Recommended)

Already configured in docker-compose.yml:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify
docker-compose exec postgres pg_isready -U lvigs
```

### Option 2: Native PostgreSQL Installation

```bash
# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql -c "CREATE USER lvigs WITH PASSWORD 'YOUR_STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE lvigs_mart OWNER lvigs;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lvigs_mart TO lvigs;"
```

### Production Database URL

```
DATABASE_URL=postgresql://lvigs:YOUR_STRONG_PASSWORD@localhost:5432/lvigs_mart?schema=public
```

## Prisma Migration Deployment

### Apply Migrations (Production)

```bash
cd /opt/lvigs-mart/backend

# Generate Prisma client
npx prisma generate

# Apply pending migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

### Migration Safety Rules

- **NEVER** run `prisma migrate reset` in production
- **NEVER** run `prisma migrate dev` in production
- **ALWAYS** test migrations on staging first
- **ALWAYS** backup before applying migrations
- Use `prisma migrate deploy` for production

## Connection Pooling

### Prisma Connection Pool

Configure in DATABASE_URL:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=10
```

### PgBouncer (Optional, for High Traffic)

```ini
[databases]
lvigs_mart = host=localhost port=5432 dbname=lvigs_mart

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

## Performance Tuning

### PostgreSQL postgresql.conf

```ini
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connections
max_connections = 100

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

## Backup Strategy

### Automated Daily Backup

```bash
#!/bin/bash
# /opt/lvigs-mart/scripts/backup-db.sh

BACKUP_DIR="/opt/lvigs-mart/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p $BACKUP_DIR

# Dump database
pg_dump -h localhost -U lvigs lvigs_mart | gzip > $BACKUP_DIR/lvigs_mart_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: lvigs_mart_$DATE.sql.gz"
```

### Cron Schedule

```bash
# Run daily at 2 AM
0 2 * * * /opt/lvigs-mart/scripts/backup-db.sh >> /var/log/lvigs-backup.log 2>&1
```

### Restore from Backup

```bash
# Decompress
gunzip backup_file.sql.gz

# Restore
psql -h localhost -U lvigs lvigs_mart < backup_file.sql
```

## Verification Checklist

- [ ] PostgreSQL running and accepting connections
- [ ] lvigs user created with correct permissions
- [ ] lvigs_mart database created
- [ ] Prisma schema validated (`npx prisma validate`)
- [ ] All migrations applied (`npx prisma migrate status`)
- [ ] 87 tables created
- [ ] 304 indexes created
- [ ] Connection pool configured
- [ ] Backup script tested
- [ ] Cron job scheduled
