#!/bin/bash

# Nginx Configuration Helper for Royal Shape Backend
# This script helps set up Nginx as a reverse proxy with SSL

set -e

echo "🌐 Setting up Nginx Reverse Proxy for Royal Shape Backend"
echo "=========================================================="

DOMAIN=${1:-""}

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./setup-nginx.sh your-domain.com"
    exit 1
fi

# Install Nginx
echo "Installing Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# Install Certbot for SSL
echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/royal-shape-backend > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/royal-shape-backend-access.log;
    error_log /var/log/nginx/royal-shape-backend-error.log;

    # Proxy settings
    location / {
        proxy_pass http://localhost:8070;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8070/;
        access_log off;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/royal-shape-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Get SSL certificate
echo ""
echo "Setting up SSL certificate with Let's Encrypt..."
echo "You will be prompted to enter your email and agree to terms."
echo ""
sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}

# Set up auto-renewal
sudo systemctl enable certbot.timer

echo ""
echo "=========================================="
echo "✓ Nginx setup complete!"
echo "=========================================="
echo ""
echo "Your API is now accessible at:"
echo "  https://${DOMAIN}"
echo ""
echo "SSL certificate will auto-renew via certbot timer."
echo ""
echo "Useful commands:"
echo "  Check Nginx status:  sudo systemctl status nginx"
echo "  Restart Nginx:       sudo systemctl restart nginx"
echo "  View logs:           sudo tail -f /var/log/nginx/royal-shape-backend-*.log"
echo "  Renew SSL manually:  sudo certbot renew"
