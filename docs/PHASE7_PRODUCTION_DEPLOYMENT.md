# PHASE 7 — Production Deployment Guide

Generated: 2026-09-08

---

## Prerequisites

- Ubuntu 22.04+ or Debian 12+ server
- Minimum 2GB RAM, 2 vCPU
- 50GB disk space
- Root or sudo access
- Domain name configured in DNSExit
- DNS records pointing to server IP

## Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL client (for local management)
sudo apt install postgresql-client -y

# Install Git
sudo apt install git -y

# Logout and login for group changes
exit
```

## Step 2: Clone Repository

```bash
# Clone to /opt
cd /opt
sudo git clone https://github.com/YOUR_ORG/lvigs-mart.git
cd lvigs-mart

# Set ownership
sudo chown -R $USER:$USER /opt/lvigs-mart
```

## Step 3: Environment Setup

```bash
# Copy production env
cp .env.production.example .env.production

# Edit with actual values
nano .env.production

# CRITICAL: Generate secure secrets
openssl rand -hex 32  # Use for JWT_ACCESS_SECRET
openssl rand -hex 32  # Use for JWT_REFRESH_SECRET
openssl rand -base64 32  # Use for POSTGRES_PASSWORD
openssl rand -base64 32  # Use for REDIS_PASSWORD
```

## Step 4: Start Services

```bash
# Start everything
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f backend
```

## Step 5: Database Setup

```bash
# Wait for PostgreSQL to be ready
docker compose -f docker-compose.production.yml exec postgres pg_isready

# Run migrations
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy

# Verify
docker compose -f docker-compose.production.yml exec backend npx prisma migrate status
```

## Step 6: Nginx Configuration

```bash
# Copy Nginx config
sudo cp deploy/nginx/lvigs-mart.conf /etc/nginx/conf.d/

# Update domain in config
sudo nano /etc/nginx/conf.d/lvigs-mart.conf
# Replace YOUR_DOMAIN with actual domain

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## Step 7: SSL Certificates

```bash
# Get certificates (DNS must be propagating)
sudo certbot --nginx \
  -d YOUR_DOMAIN \
  -d www.YOUR_DOMAIN \
  -d api.YOUR_DOMAIN

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Step 8: Firebase Configuration

```bash
# Update Firebase credentials in .env.production
# FIREBASE_PROJECT_ID
# FIREBASE_CLIENT_EMAIL
# FIREBASE_PRIVATE_KEY

# Restart backend
docker compose -f docker-compose.production.yml restart backend
```

## Step 9: Payment Gateway

```bash
# Update Razorpay credentials in .env.production
# RAZORPAY_KEY_ID (live key)
# RAZORPAY_KEY_SECRET (live secret)

# Update frontend
# NEXT_PUBLIC_RAZORPAY_KEY_ID

# Restart
docker compose -f docker-compose.production.yml restart backend frontend
```

## Step 10: Monitoring Setup

```bash
# Install monitoring agent (optional)
# For Sentry: Add SENTRY_DSN to .env.production

# Check health
curl https://api.YOUR_DOMAIN/api/health
curl https://api.YOUR_DOMAIN/api/health/ready
```

## Step 11: Backup Setup

```bash
# Create backup directory
mkdir -p /opt/lvigs-mart/backups/postgres

# Create backup script
cat > /opt/lvigs-mart/scripts/backup-db.sh << 'EOF'
#!/bin/bash
set -e
BACKUP_DIR="/opt/lvigs-mart/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30
mkdir -p $BACKUP_DIR
docker compose -f /opt/lvigs-mart/docker-compose.production.yml exec -T postgres pg_dump -U lvigs lvigs_mart | gzip > $BACKUP_DIR/lvigs_mart_$DATE.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "$(date): Backup completed" >> /var/log/lvigs-backup.log
EOF

chmod +x /opt/lvigs-mart/scripts/backup-db.sh

# Schedule daily backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/lvigs-mart/scripts/backup-db.sh") | crontab -
```

## Step 12: Verification

```bash
# Test all endpoints
curl -I https://YOUR_DOMAIN
curl -I https://www.YOUR_DOMAIN
curl https://api.YOUR_DOMAIN/api/health
curl https://api.YOUR_DOMAIN/api/health/ready
curl https://api.YOUR_DOMAIN/api/products?limit=1
curl https://api.YOUR_DOMAIN/api/banners/active

# Test frontend
curl -s https://www.YOUR_DOMAIN | head -20

# Test WebSocket (optional)
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://api.YOUR_DOMAIN/socket.io/
```

## Rollback Procedure

```bash
# If something goes wrong, rollback:

# 1. Stop all services
docker compose -f docker-compose.production.yml down

# 2. Restore database from backup
gunzip /opt/lvigs-mart/backups/postgres/lvigs_mart_YYYYMMDD.sql.gz
docker compose -f docker-compose.production.yml exec -T postgres psql -U lvigs lvigs_mart < lvigs_mart_YYYYMMDD.sql

# 3. Restart with previous version
git checkout PREVIOUS_COMMIT
docker compose -f docker-compose.production.yml up -d --build
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check logs: `docker compose logs backend` |
| Database connection failed | Verify PostgreSQL is running: `docker compose ps` |
| Redis connection failed | Check Redis password in .env.production |
| 502 Bad Gateway | Backend not running or Nginx config wrong |
| SSL error | Check certificate: `openssl s_client -connect api.YOUR_DOMAIN:443` |
| CORS error | Update WEB_ORIGIN in .env.production |
