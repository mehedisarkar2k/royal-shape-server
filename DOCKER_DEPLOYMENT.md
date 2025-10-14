# Royal Shape Backend - Docker Deployment Guide

## 📦 Quick Start - Local Testing

### 1. Build and Run Locally

```bash
# Build the Docker image
docker-compose build

# Start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

Or use the Makefile:

```bash
make build    # Build image
make up       # Start containers
make logs     # View logs
make ps       # Check status
```

### 2. Access the Application

- Local: http://localhost:8070
- Health check: http://localhost:8070/

---

## 🚀 Digital Ocean Deployment

### Prerequisites

- Digital Ocean Droplet (Ubuntu 22.04 LTS recommended)
- At least 2GB RAM, 1 vCPU (Basic $12/month droplet)
- Domain name pointed to your droplet's IP (optional but recommended)

### Step 1: Prepare Your Droplet

SSH into your droplet:

```bash
ssh root@your-droplet-ip
```

Run the server setup script:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/trizen-solutions/royal-shape-backend/main/setup-server.sh | bash

# Or if you have the repository:
./setup-server.sh
```

This will install:

- Docker & Docker Compose
- Node.js v22
- Required system packages
- Configure firewall

**Important:** Log out and log back in after setup for Docker permissions to take effect.

### Step 2: Clone Your Repository

```bash
# Create app directory
sudo mkdir -p /opt/royal-shape-backend
sudo chown -R $USER:$USER /opt/royal-shape-backend

# Clone repository
cd /opt/royal-shape-backend
git clone https://github.com/trizen-solutions/royal-shape-backend.git .
```

### Step 3: Configure Environment Variables

Create production environment file:

```bash
cp .env.production.template .env.production
nano .env.production
```

Update the following values:

- `SERVER_BASE_URL`: Your domain or droplet IP
- `ENVIRONMENT`: Set to "production"
- All other values as needed

### Step 4: Deploy

Run the deployment script:

```bash
./deploy.sh
```

This will:

- Build the Docker image
- Start the containers
- Show health status and logs

### Step 5: Set Up Nginx (Optional but Recommended)

For domain with SSL:

```bash
./setup-nginx.sh your-domain.com
```

This will:

- Install and configure Nginx
- Set up SSL with Let's Encrypt
- Configure reverse proxy
- Enable auto-renewal of SSL certificates

---

## 🔧 Management Commands

### Using Makefile (Recommended)

```bash
make help          # Show all available commands
make up            # Start containers
make down          # Stop containers
make restart       # Restart containers
make logs          # View logs (follow mode)
make logs-tail     # View last 100 log lines
make ps            # Show container status
make shell         # Open shell in container
make stats         # Show resource usage
make backup-volumes # Backup uploads and logs
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f royal-shape-backend

# Execute command in container
docker-compose exec royal-shape-backend sh

# Check container status
docker-compose ps
```

### Using Docker Commands

```bash
# View running containers
docker ps

# View logs
docker logs royal-shape-backend -f

# Stop container
docker stop royal-shape-backend

# Start container
docker start royal-shape-backend

# Remove container
docker rm royal-shape-backend

# View container stats
docker stats royal-shape-backend
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# All logs (follow mode)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs since timestamp
docker-compose logs --since 30m
```

### Health Checks

The container includes automatic health checks:

```bash
# Check container health
docker inspect royal-shape-backend --format='{{.State.Health.Status}}'

# View health check logs
docker inspect royal-shape-backend --format='{{json .State.Health}}' | jq
```

### Resource Usage

```bash
# Real-time stats
docker stats royal-shape-backend

# Or using make
make stats
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or use the deploy script
./deploy.sh
```

### Backup Data

```bash
# Backup uploads and logs
make backup-volumes

# Manual backup
docker run --rm \
  -v royal-shape-backend_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

### Restore Data

```bash
# Restore uploads
docker run --rm \
  -v royal-shape-backend_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit .env.production to git
2. **Firewall**: Only open necessary ports (80, 443, 8070, 22)
3. **SSL**: Always use HTTPS in production (use setup-nginx.sh)
4. **Updates**: Keep Docker and system packages updated
5. **Backups**: Regular backups of volumes and database
6. **Non-root**: Container runs as non-root user (nodejs:1001)

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
sudo lsof -i :8070

# Inspect container
docker inspect royal-shape-backend
```

### Database Connection Issues

```bash
# Test MongoDB connection from container
docker-compose exec royal-shape-backend sh
# Inside container:
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Permission Issues

```bash
# Fix volume permissions
docker-compose down
sudo chown -R 1001:1001 /var/lib/docker/volumes/royal-shape-backend_uploads_data
sudo chown -R 1001:1001 /var/lib/docker/volumes/royal-shape-backend_logs_data
docker-compose up -d
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Adjust resource limits in docker-compose.yml
# Then restart:
docker-compose down
docker-compose up -d
```

### Clean Everything and Start Fresh

```bash
# Stop and remove everything
docker-compose down -v --rmi all

# Clean Docker system
docker system prune -af

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

---

## 📈 Performance Tuning

### Resource Limits

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: "2" # Adjust based on droplet
      memory: 2G # Adjust based on droplet
```

### Database Optimization

- Use MongoDB indexes properly
- Enable MongoDB connection pooling
- Monitor slow queries

### Enable Production Optimizations

Ensure in `.env.production`:

```env
NODE_ENV=production
ENVIRONMENT=production
```

---

## 🔗 Useful Links

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Digital Ocean: https://www.digitalocean.com/docs/
- Let's Encrypt: https://letsencrypt.org/
- Nginx: https://nginx.org/en/docs/

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review application logs: `docker-compose logs`
3. Check system resources: `docker stats`
4. Review environment variables: `.env.production`

---

## ✅ Deployment Checklist

- [ ] Server setup completed (Docker, Docker Compose installed)
- [ ] Repository cloned to `/opt/royal-shape-backend`
- [ ] `.env.production` created with correct values
- [ ] MongoDB Atlas accessible from droplet IP
- [ ] Firebase credentials configured
- [ ] R2 storage credentials configured
- [ ] SMTP credentials configured
- [ ] Firewall configured (ports 80, 443, 8070, 22)
- [ ] Application deployed and running
- [ ] Health checks passing
- [ ] Nginx configured with SSL (if using domain)
- [ ] Backups strategy in place
- [ ] Monitoring set up
