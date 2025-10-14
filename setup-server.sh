#!/bin/bash

# Digital Ocean Droplet Setup Script
# Run this script on your fresh Ubuntu droplet to set up Docker and required dependencies

set -e

echo "🔧 Setting up Digital Ocean Droplet for Royal Shape Backend"
echo "==========================================================="

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    sudo usermod -aG docker $USER

    echo "✓ Docker installed successfully"
else
    echo "✓ Docker is already installed"
fi

# Install Docker Compose (standalone)
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose installed successfully"
else
    echo "✓ Docker Compose is already installed"
fi

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 8070/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable || true

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /opt/royal-shape-backend
sudo chown -R $USER:$USER /opt/royal-shape-backend

# Install Node.js v22 (optional, for debugging)
echo "Installing Node.js v22..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✓ Node.js installed successfully"
else
    echo "✓ Node.js v22 is already installed"
fi

# Install yarn (optional)
if ! command -v yarn &> /dev/null; then
    sudo npm install -g yarn
    echo "✓ Yarn installed successfully"
else
    echo "✓ Yarn is already installed"
fi

echo ""
echo "==========================================================="
echo "✓ Server setup complete!"
echo "==========================================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Clone your repository to /opt/royal-shape-backend"
echo "3. Create .env.production file with your production variables"
echo "4. Run ./deploy.sh to start the application"
echo ""
echo "Important: You may need to log out and log back in for Docker"
echo "           permissions to take effect, or run: newgrp docker"
