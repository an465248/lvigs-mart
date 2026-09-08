# PHASE 7 — DNSExit Domain Setup

Generated: 2026-09-08

---

## Architecture

```
Internet
   |
DNSExit (DNS Provider)
   |
   +---- www.YOUR_DOMAIN  --->  Nginx  --->  Frontend (:3000)
   |
   +---- api.YOUR_DOMAIN   --->  Nginx  --->  Backend (:4000)
   |
   +---- (optional) admin.YOUR_DOMAIN  --->  Nginx  --->  Frontend (:3000)
```

## DNS Records Required

### Option A: VPS with Static IP

| Record | Type | Name | Value | TTL |
|--------|------|------|-------|-----|
| Root | A | @ | SERVER_PUBLIC_IP | 300 |
| WWW | A | www | SERVER_PUBLIC_IP | 300 |
| API | A | api | SERVER_PUBLIC_IP | 300 |
| Admin | A | admin | SERVER_PUBLIC_IP | 300 |

### Option B: Cloud/VPS with Elastic IP

| Record | Type | Name | Value | TTL |
|--------|------|------|-------|-----|
| Root | A | @ | YOUR_ELASTIC_IP | 300 |
| WWW | CNAME | www | YOUR_DOMAIN | 300 |
| API | CNAME | api | YOUR_DOMAIN | 300 |

## DNSExit Setup Steps

### Step 1: Login to DNSExit

1. Go to https://www.dnsexit.com/
2. Login to your account
3. Navigate to DNS Management

### Step 2: Add DNS Records

1. Select your domain
2. Click "Add Record" or "DNS Management"
3. Add the A records from the table above
4. Replace `SERVER_PUBLIC_IP` with your actual server IP

### Step 3: Wait for Propagation

DNS propagation typically takes:
- **Minimum:** 5 minutes
- **Typical:** 15-60 minutes
- **Maximum:** 48 hours

### Step 4: Verify DNS

```bash
# Check if DNS is resolving
dig YOUR_DOMAIN +short
dig www.YOUR_DOMAIN +short
dig api.YOUR_DOMAIN +short

# Or use nslookup
nslookup YOUR_DOMAIN
nslookup www.YOUR_DOMAIN
nslookup api.YOUR_DOMAIN
```

### Step 5: Verify from Multiple Locations

```bash
# Use Google DNS
dig @8.8.8.8 YOUR_DOMAIN +short

# Use Cloudflare DNS
dig @1.1.1.1 YOUR_DOMAIN +short
```

## SSL Certificate Setup

After DNS is propagating, install SSL certificates:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate for all domains
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN -d api.YOUR_DOMAIN

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Verification Checklist

- [ ] DNS records created in DNSExit
- [ ] DNS propagation verified (dig/nslookup)
- [ ] Nginx configured with server blocks
- [ ] SSL certificates installed
- [ ] HTTP → HTTPS redirect working
- [ ] www.YOUR_DOMAIN loads frontend
- [ ] api.YOUR_DOMAIN loads backend API
- [ ] /api/health returns ok
- [ ] /api/health/ready returns checks

## Placeholder Values

Replace these in all deployment docs:

| Placeholder | Replace With |
|-------------|--------------|
| `YOUR_DOMAIN` | Your actual domain |
| `SERVER_PUBLIC_IP` | Your server's public IP |
| `JWT_ACCESS_SECRET` | Random 64-char string |
| `JWT_REFRESH_SECRET` | Random 64-char string |
| `POSTGRES_PASSWORD` | Strong password |
