#!/bin/bash

# Git Commit Helper for Docker Setup
# This script helps you commit all the Docker-related files to your repository

echo "🔍 Checking Git status..."
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository. Please initialize git first:"
    echo "   git init"
    exit 1
fi

echo "📋 Files to be committed:"
echo ""
echo "Docker Configuration:"
echo "  - Dockerfile"
echo "  - .dockerignore"
echo "  - docker-compose.yml"
echo "  - docker-compose.dev.yml"
echo ""
echo "Deployment Scripts:"
echo "  - deploy.sh"
echo "  - setup-server.sh"
echo "  - setup-nginx.sh"
echo "  - quick.sh"
echo ""
echo "Helper Files:"
echo "  - Makefile"
echo "  - .env.production.template"
echo ""
echo "Documentation:"
echo "  - DOCKER_DEPLOYMENT.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo "  - DOCKER_SETUP_SUMMARY.md"
echo ""
echo "CI/CD:"
echo "  - .github/workflows/docker-build.yml"
echo ""

read -p "📝 Do you want to add these files to git? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Add Docker files
echo ""
echo "➕ Adding Docker configuration files..."
git add Dockerfile .dockerignore docker-compose.yml docker-compose.dev.yml

# Add deployment scripts
echo "➕ Adding deployment scripts..."
git add deploy.sh setup-server.sh setup-nginx.sh quick.sh

# Add helper files
echo "➕ Adding helper files..."
git add Makefile .env.production.template

# Add documentation
echo "➕ Adding documentation..."
git add DOCKER_DEPLOYMENT.md DEPLOYMENT_CHECKLIST.md DOCKER_SETUP_SUMMARY.md

# Add CI/CD
echo "➕ Adding CI/CD workflow..."
git add .github/workflows/docker-build.yml

echo ""
echo "✅ Files added to staging area"
echo ""

# Show git status
echo "📊 Git status:"
git status --short

echo ""
read -p "💾 Commit these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled. Files are staged but not committed."
    echo "   You can commit manually with: git commit -m 'your message'"
    exit 1
fi

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "feat: Add Docker configuration for production deployment

- Add multi-stage Dockerfile with Node 22 Alpine
- Add docker-compose for production and development
- Add automated deployment scripts (deploy.sh, setup-server.sh, setup-nginx.sh)
- Add Makefile and quick.sh for convenient commands
- Add comprehensive documentation (deployment guide, checklist)
- Add GitHub Actions workflow for automated builds
- Add environment template for production
- Optimize image size to 264MB
- Include health checks and security configurations
- Add volume management for uploads and logs"

echo ""
echo "✅ Changes committed successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Push to remote: git push origin $(git branch --show-current)"
echo "   2. Test locally: docker-compose up"
echo "   3. Deploy to production: Follow DOCKER_DEPLOYMENT.md"
echo ""
