.PHONY: help build up down restart logs ps clean test-build

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	docker-compose build --no-cache

up: ## Start the containers
	docker-compose up -d

down: ## Stop the containers
	docker-compose down

restart: ## Restart the containers
	docker-compose restart

logs: ## View container logs (follow mode)
	docker-compose logs -f

logs-tail: ## View last 100 lines of logs
	docker-compose logs --tail=100

ps: ## Show container status
	docker-compose ps

clean: ## Stop containers and remove volumes
	docker-compose down -v
	docker system prune -f

clean-all: ## Deep clean (remove images too)
	docker-compose down -v --rmi all
	docker system prune -af

test-build: ## Test build the Docker image
	docker build -t royal-shape-backend-test .

shell: ## Open a shell in the running container
	docker-compose exec royal-shape-backend sh

deploy: ## Deploy to production (builds and starts)
	@echo "Deploying to production..."
	./deploy.sh

stats: ## Show container resource usage
	docker stats royal-shape-backend

inspect: ## Inspect the running container
	docker inspect royal-shape-backend

backup-volumes: ## Backup Docker volumes
	@echo "Backing up volumes..."
	@mkdir -p backups
	@docker run --rm -v royal-shape-backend_uploads_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/uploads-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@docker run --rm -v royal-shape-backend_logs_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/logs-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "✓ Backups created in ./backups/"

prod-env: ## Copy .env to .env (for first time setup)
	@if [ ! -f .env ]; then \
		cp .env .env; \
		echo "✓ Created .env from .env"; \
		echo "⚠️  Please review and update .env with production values"; \
	else \
		echo "⚠️  .env already exists"; \
	fi
