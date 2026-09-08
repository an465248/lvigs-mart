# PHASE 7 — SSL/HTTPS Setup

Generated: 2026-09-08

---

## Prerequisites

1. DNS records must be propagating (see PHASE7_DNSEXIT_SETUP.md)
2. Nginx must be installed and configured
3. Ports 80 and 443 must be open

## Option 1: Let's Encrypt (Recommended)

### Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain Certificate

```bash
# For all domains
sudo certbot --nginx \
  -d YOUR_DOMAIN \
  -d www.YOUR_DOMAIN \
  -d api.YOUR_DOMAIN

# Follow the prompts:
# 1. Enter email for renewal notices
# 2. Agree to terms of service
# 3. Choose whether to redirect HTTP to HTTPS (YES)
```

### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Certificate Locations

After installation, certificates are at:

```
/etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem
/etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem
```

## Option 2: Manual SSL (If Using Custom CA)

### Generate CSR

```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/ssl/private/lvigs-mart.key \
  -out /etc/ssl/certs/lvigs-mart.csr
```

### Configure Nginx with Manual Certs

```nginx
ssl_certificate /etc/ssl/certs/lvigs-mart.crt;
ssl_certificate_key /etc/ssl/private/lvigs-mart.key;
```

## SSL Configuration Best Practices

### Nginx SSL Settings

```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;

# Security Headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Verification

```bash
# Check SSL certificate
openssl s_client -connect YOUR_DOMAIN:443 -servername YOUR_DOMAIN

# Check from curl
curl -I https://YOUR_DOMAIN
curl -I https://api.YOUR_DOMAIN/api/health

# Check certificate expiry
echo | openssl s_client -connect YOUR_DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
```

## Auto-Renewal Cron

Certbot sets up a systemd timer automatically. Verify:

```bash
systemctl list-timers | grep certbot
```

If not using systemd:

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not found | Wait for DNS propagation, then retry |
| Challenge failed | Ensure port 80 is open and Nginx is running |
| Auto-renewal failed | Check `systemctl status certbot.timer` |
| Mixed content errors | Ensure all resources use HTTPS |
