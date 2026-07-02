.PHONY: dev up down seed test lint

dev:
	docker compose up --build

up:
	docker compose up -d --build

down:
	docker compose down -v

seed:
	docker compose exec platform-api python scripts/seed_demo_data.py

test:
	python -m pytest tests/ -v --tb=short

lint:
	python -m ruff check services/platform-api/app services/memory_service/app services/agent_orchestration_service/app tests
	cd apps/web && npm run typecheck

logs-api:
	docker compose logs -f platform-api

logs-web:
	docker compose logs -f web
