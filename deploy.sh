#!/bin/bash

# Royal Shape Backend - Deployment Script for Digital Ocean
# This script helps deploy the dockerized application to a Digital Ocean droplet

set -e

echo "🚀 Royal Shape Backend - Digital Ocean Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please create .env.production with your production environment variables."
    echo "You can use .env.production.template as a reference."
    exit 1
fi

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    echo "Please install Docker first: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker Compose is installed"

# Stop existing containers
echo ""
echo "Stopping existing containers..."
docker-compose down || true

# Remove old images (optional, comment out if you want to keep old images)
echo ""
echo "Removing old images..."
docker image prune -f

# Build the Docker image
echo ""
echo "Building Docker image..."
docker-compose build --no-cache

# Start the containers
echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for the service to be healthy
echo ""
echo "Waiting for service to be healthy..."
sleep 10

# Check if container is running
if [ "$(docker ps -q -f name=royal-shape-backend)" ]; then
    echo -e "${GREEN}✓${NC} Container is running"

    # Show container status
    echo ""
    echo "Container Status:"
    docker ps -f name=royal-shape-backend

    # Show logs
    echo ""
    echo "Recent logs:"
    docker-compose logs --tail=50

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Your API is now running at: ${SERVER_BASE_URL}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:          docker-compose logs -f"
    echo "  Restart:            docker-compose restart"
    echo "  Stop:               docker-compose down"
    echo "  View status:        docker-compose ps"
else
    echo -e "${RED}✗ Container failed to start${NC}"
    echo ""
    echo "Showing error logs:"
    docker-compose logs
    exit 1
fi
