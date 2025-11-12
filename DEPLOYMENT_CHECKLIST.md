# Digital Ocean Deployment Checklist

## Pre-Deployment Preparation

### Local Testing

- [ ] Docker image builds successfully (`docker build -t test .`)
- [ ] Application runs in Docker locally (`docker-compose up`)
- [ ] All environment variables are documented
- [ ] Database connection works from container
- [ ] File uploads work correctly
- [ ] Email sending works
- [ ] Firebase authentication works

### Digital Ocean Setup

- [ ] Droplet created (Ubuntu 22.04 LTS recommended)
- [ ] Minimum 2GB RAM, 1 vCPU
- [ ] SSH access configured
- [ ] Domain name configured (optional)
- [ ] DNS A record points to droplet IP (if using domain)

---

## Server Preparation

### 1. Initial Server Setup

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Run setup script
curl -fsSL https://raw.githubusercontent.com/YOUR-ORG/royal-shape-backend/main/setup-server.sh | bash

# Or manually:
./setup-server.sh
```

- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Node.js v22 installed
- [ ] Firewall configured (ports 22, 80, 443, 8070)
- [ ] User has Docker permissions (log out/in after setup)

### 2. Clone Repository

```bash
# Create directory
sudo mkdir -p /opt/royal-shape-backend
sudo chown -R $USER:$USER /opt/royal-shape-backend

# Clone repo
cd /opt/royal-shape-backend
git clone https://github.com/trizen-solutions/royal-shape-backend.git .
```

- [ ] Repository cloned successfully
- [ ] All files present
- [ ] Scripts are executable

---

## Configuration

### 3. Environment Variables

```bash
# Copy template
cp .env.production.template .env

# Edit with production values
nano .env
```

**Critical Variables to Update:**

- [ ] `PROJECT_NAME` - Set appropriately
- [ ] `ENVIRONMENT` - Set to "production"
- [ ] `PORT` - Usually 8070
- [ ] `SERVER_BASE_URL` - Your domain or droplet IP
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `SMTP_EMAIL` - Email sender address
- [ ] `SMTP_PASSWORD` - Email password/app password
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_PRIVATE_KEY` - Firebase private key (properly escaped)
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- [ ] `ACCESS_TOKEN_PUBLIC_KEY` - JWT public key (base64)
- [ ] `ACCESS_TOKEN_PRIVATE_KEY` - JWT private key (base64)
- [ ] `ACCESS_TOKEN_EXPIRY` - Token expiry (e.g., "1d")
- [ ] `REFRESH_TOKEN_PUBLIC_KEY` - Refresh token public key
- [ ] `REFRESH_TOKEN_PRIVATE_KEY` - Refresh token private key
- [ ] `REFRESH_TOKEN_EXPIRY` - Refresh token expiry (e.g., "30d")
- [ ] `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- [ ] `R2_BUCKET` - R2 bucket name
- [ ] `R2_ENDPOINT` - R2 endpoint URL
- [ ] `R2_PUBLIC_BASE_URL` - R2 public URL
- [ ] `R2_SECRET_ACCESS_KEY` - R2 secret key
- [ ] `R2_TOKEN` - R2 token

### 4. External Services Checklist

- [ ] MongoDB Atlas cluster accessible from droplet IP
  - Add droplet IP to MongoDB whitelist
  - Test connection: `mongosh "your-connection-string"`
- [ ] Firebase project properly configured
  - Service account key downloaded
  - Authentication methods enabled
- [ ] Cloudflare R2 bucket created and configured
  - Public access configured if needed
  - CORS configured if needed
- [ ] SMTP credentials working
  - Test email sending
  - Check rate limits

---

## Deployment

### 5. Build and Deploy

```bash
# Make scripts executable
chmod +x deploy.sh setup-nginx.sh quick.sh

# Run deployment
./deploy.sh
```

- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Health check passes
- [ ] Application logs show no errors
- [ ] API responds to requests

### 6. Verify Deployment

```bash
# Check container status
docker ps

# View logs
docker logs royal-shape-backend -f

# Test health endpoint
curl http://localhost:8070/

# Check resource usage
docker stats royal-shape-backend
```

- [ ] Container status: "Up" and "healthy"
- [ ] No critical errors in logs
- [ ] MongoDB connected
- [ ] Firebase initialized
- [ ] Health endpoint returns 200

---

## Post-Deployment

### 7. SSL & Domain Setup (If Using Domain)

```bash
# Run nginx setup
./setup-nginx.sh your-domain.com
```

- [ ] Nginx installed and configured
- [ ] SSL certificate obtained from Let's Encrypt
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured

### 8. Security Hardening

- [ ] Change default SSH port (optional)
- [ ] Disable root SSH login
- [ ] Set up SSH key-only authentication
- [ ] Configure fail2ban (optional)
- [ ] Enable automatic security updates
- [ ] Review firewall rules
- [ ] Ensure .env is not readable by others
  ```bash
  chmod 600 .env
  ```

### 9. Monitoring Setup

- [ ] Set up log rotation
  ```bash
  # Configure Docker log limits in daemon.json
  sudo nano /etc/docker/daemon.json
  ```
  Add:
  ```json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }
  ```
- [ ] Set up monitoring (optional: Uptime Robot, Better Uptime, etc.)
- [ ] Configure alerts for downtime
- [ ] Set up backup strategy

### 10. Backup Strategy

```bash
# Test backup
make backup-volumes

# Schedule regular backups (cron)
crontab -e
```

Add backup cron job:

```cron
# Backup volumes daily at 2 AM
0 2 * * * cd /opt/royal-shape-backend && make backup-volumes
```

- [ ] Manual backup tested
- [ ] Automated backups scheduled
- [ ] Backup restoration tested
- [ ] Database backups configured (MongoDB Atlas snapshots)

---

## Testing

### 11. API Testing

Test all major endpoints:

- [ ] Root endpoint: `curl https://your-domain.com/`
- [ ] Health check: `curl https://your-domain.com/v1/`
- [ ] Auth endpoints work
- [ ] Booking creation works
- [ ] File upload works
- [ ] Email sending works

### 12. Performance Testing

- [ ] Load test with expected traffic
- [ ] Monitor resource usage under load
- [ ] Check response times
- [ ] Verify database queries are optimized

---

## Maintenance

### Regular Tasks

- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space usage
- [ ] Monthly: Review and update dependencies
- [ ] Monthly: Test backup restoration
- [ ] As needed: Update application code
- [ ] As needed: Scale resources if needed

### Update Procedure

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy.sh

# Or manually:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Rollback Plan

If deployment fails:

1. **Quick Rollback**

   ```bash
   # Stop current deployment
   docker-compose down

   # Revert to previous commit
   git reset --hard HEAD~1

   # Redeploy
   ./deploy.sh
   ```

2. **From Backup**
   ```bash
   # Restore volumes
   docker run --rm \
     -v royal-shape-backend_uploads_data:/data \
     -v $(pwd)/backups:/backup \
     alpine tar xzf /backup/uploads-TIMESTAMP.tar.gz -C /data
   ```

---

## Troubleshooting Quick Reference

### Container won't start

```bash
docker logs royal-shape-backend
docker inspect royal-shape-backend
```

### Database connection issues

```bash
docker exec -it royal-shape-backend sh
# Test connection inside container
```

### High memory usage

```bash
docker stats
# Adjust limits in docker-compose.yml
```

### SSL certificate issues

```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl restart nginx
```

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] Application is accessible via domain/IP
- [ ] HTTPS is working (if domain configured)
- [ ] All API endpoints respond correctly
- [ ] Database operations work
- [ ] File uploads work
- [ ] Emails are sent successfully
- [ ] Authentication works
- [ ] No critical errors in logs
- [ ] Health checks pass
- [ ] Resource usage is within acceptable limits
- [ ] Backups are configured and tested

---

## Emergency Contacts

- **MongoDB Atlas Support**: https://support.mongodb.com/
- **Firebase Support**: https://support.google.com/firebase
- **Digital Ocean Support**: https://www.digitalocean.com/support
- **Cloudflare Support**: https://support.cloudflare.com/

---

## Notes

- Keep this checklist updated as deployment process evolves
- Document any issues encountered and their solutions
- Share learnings with the team

**Deployment Date**: **\*\***\_\_\_**\*\***
**Deployed By**: **\*\***\_\_\_**\*\***
**Droplet IP**: **\*\***\_\_\_**\*\***
**Domain**: **\*\***\_\_\_**\*\***
