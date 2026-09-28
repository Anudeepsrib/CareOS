.PHONY: install dev up down reset seed test lint

install:
	python -m pip install -r services/platform-api/requirements.txt -r requirements-dev.txt
	cd apps/web && npm ci

dev:
	docker compose up --build

up:
	docker compose up -d --build

down:
	docker compose down

reset:
	docker compose down -v

seed:
	docker compose exec platform-api python scripts/seed_demo_data.py

test:
	python -m pytest

lint:
	python -m ruff check .
	cd apps/web && npm run typecheck

logs-api:
	docker compose logs -f platform-api

logs-web:
	docker compose logs -f web
