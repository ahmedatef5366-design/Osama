.PHONY: help install dev-web dev-api db-up db-down db-reset migrate-up migrate-down lint test build

help:
	@echo "Common targets:"
	@echo "  install        Install JS workspace deps (pnpm install)"
	@echo "  db-up          Start Postgres + Redis via Docker"
	@echo "  db-down        Stop Docker services"
	@echo "  migrate-up     Run all up migrations against \$$DATABASE_URL"
	@echo "  migrate-down   Roll back the latest migration"
	@echo "  dev-web        Run Next.js dev server"
	@echo "  dev-api        Run Go API dev server"
	@echo "  lint           Lint both apps"
	@echo "  test           Run all tests"
	@echo "  build          Build both apps"

install:
	pnpm install

db-up:
	docker compose up -d postgres redis

db-down:
	docker compose down

db-reset:
	docker compose down -v
	docker compose up -d postgres redis

migrate-up:
	$(MAKE) -C apps/api migrate-up

migrate-down:
	$(MAKE) -C apps/api migrate-down

dev-web:
	pnpm --filter @osama/web dev

dev-api:
	$(MAKE) -C apps/api dev

lint:
	pnpm --filter @osama/web lint
	$(MAKE) -C apps/api lint

test:
	$(MAKE) -C apps/api test

build:
	pnpm --filter @osama/web build
	$(MAKE) -C apps/api build
