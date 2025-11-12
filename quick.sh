#!/bin/bash

# Quick Commands Helper Script
# Provides easy access to common Docker operations

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_help() {
    echo "Royal Shape Backend - Quick Commands"
    echo "====================================="
    echo ""
    echo "Usage: ./quick.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start the application"
    echo "  stop        - Stop the application"
    echo "  restart     - Restart the application"
    echo "  logs        - View logs (follow mode)"
    echo "  status      - Check container status"
    echo "  shell       - Open shell in container"
    echo "  build       - Build Docker image"
    echo "  deploy      - Full deployment (build + start)"
    echo "  clean       - Stop and clean containers"
    echo "  health      - Check application health"
    echo "  backup      - Backup volumes"
    echo "  help        - Show this help"
    echo ""
}

check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Warning: .env not found${NC}"
        echo "Run: make prod-env to create from .env"
    fi
}

case "$1" in
    start)
        echo -e "${GREEN}Starting Royal Shape Backend...${NC}"
        docker compose up -d
        echo -e "${GREEN}✓ Application started${NC}"
        docker compose ps
        ;;
    stop)
        echo -e "${YELLOW}Stopping Royal Shape Backend...${NC}"
        docker compose down
        echo -e "${GREEN}✓ Application stopped${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting Royal Shape Backend...${NC}"
        docker compose restart
        echo -e "${GREEN}✓ Application restarted${NC}"
        docker compose ps
        ;;
    logs)
        echo -e "${GREEN}Viewing logs (Ctrl+C to exit)...${NC}"
        docker compose logs -f
        ;;
    status)
        echo -e "${GREEN}Container Status:${NC}"
        docker compose ps
        echo ""
        echo -e "${GREEN}Resource Usage:${NC}"
        docker stats --no-stream royal-shape-backend 2>/dev/null || echo "Container not running"
        ;;
    shell)
        echo -e "${GREEN}Opening shell in container...${NC}"
        docker compose exec royal-shape-backend sh
        ;;
    build)
        echo -e "${GREEN}Building Docker image...${NC}"
        docker compose build --no-cache
        echo -e "${GREEN}✓ Build complete${NC}"
        ;;
    deploy)
        echo -e "${GREEN}Deploying Royal Shape Backend...${NC}"
        check_env
        ./deploy.sh
        ;;
    clean)
        echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
        docker compose down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        ;;
    health)
        echo -e "${GREEN}Checking application health...${NC}"
        if [ "$(docker ps -q -f name=royal-shape-backend)" ]; then
            HEALTH=$(docker inspect royal-shape-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
            if [ "$HEALTH" = "healthy" ]; then
                echo -e "${GREEN}✓ Application is healthy${NC}"
            elif [ "$HEALTH" = "starting" ]; then
                echo -e "${YELLOW}⏳ Application is starting...${NC}"
            else
                echo -e "${RED}✗ Application is unhealthy${NC}"
            fi

            # Try HTTP request
            echo ""
            echo "Testing HTTP endpoint..."
            curl -f http://localhost:8070/ && echo -e "\n${GREEN}✓ HTTP endpoint responding${NC}" || echo -e "\n${RED}✗ HTTP endpoint not responding${NC}"
        else
            echo -e "${RED}✗ Container is not running${NC}"
        fi
        ;;
    backup)
        echo -e "${GREEN}Creating backups...${NC}"
        make backup-volumes
        ;;
    help|*)
        show_help
        ;;
esac
