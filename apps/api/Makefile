SHELL := /bin/bash

# Load .env if present
ifneq (,$(wildcard .env))
include .env
export
endif

DATABASE_URL ?= postgres://osama:osama@localhost:5432/osama?sslmode=disable
MIGRATE_BIN  := $(shell command -v migrate 2>/dev/null)

.PHONY: help dev build run test lint fmt vet tidy sqlc migrate-up migrate-down migrate-new keys seed-foods seed-foods-dry-run

help:
	@echo "Targets:"
	@echo "  dev           go run ./cmd/server"
	@echo "  build         go build -o bin/server ./cmd/server"
	@echo "  test          go test ./..."
	@echo "  lint          gofmt -l . + go vet ./..."
	@echo "  fmt           gofmt -w ."
	@echo "  vet           go vet ./..."
	@echo "  tidy          go mod tidy"
	@echo "  sqlc          regenerate sqlc code"
	@echo "  migrate-up    apply all pending migrations"
	@echo "  migrate-down  rollback the latest migration"
	@echo "  migrate-new   NAME=foo  scaffold a new pair of migration files"
	@echo "  keys          generate dev RS256 keypair into ./keys"
	@echo "  seed-foods    bulk-load ./seed/foods/*.yaml into food_database"
	@echo "  seed-foods-dry-run  validate seed YAML without writing to the DB"

dev:
	go run ./cmd/server

build:
	@mkdir -p bin
	CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/server ./cmd/server

test:
	go test ./... -count=1

lint: vet
	@out=$$(gofmt -l .); if [ -n "$$out" ]; then echo "gofmt issues:"; echo "$$out"; exit 1; fi

fmt:
	gofmt -w .

vet:
	go vet ./...

tidy:
	go mod tidy

sqlc:
	@if ! command -v sqlc >/dev/null; then \
	  echo "sqlc not found — install: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest"; \
	  exit 1; \
	fi
	sqlc generate

migrate-up:
	@if [ -z "$(MIGRATE_BIN)" ]; then \
	  echo "migrate not found — install: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"; \
	  exit 1; \
	fi
	$(MIGRATE_BIN) -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	@if [ -z "$(MIGRATE_BIN)" ]; then \
	  echo "migrate not found — install: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"; \
	  exit 1; \
	fi
	$(MIGRATE_BIN) -path ./migrations -database "$(DATABASE_URL)" down 1

migrate-new:
	@if [ -z "$(NAME)" ]; then echo "usage: make migrate-new NAME=add_something"; exit 1; fi
	@n=$$(printf '%04d' $$(($$(ls migrations 2>/dev/null | grep -E '^[0-9]+_' | cut -d_ -f1 | sort -n | tail -1) + 1))); \
	  touch migrations/$${n}_$(NAME).up.sql migrations/$${n}_$(NAME).down.sql; \
	  echo "created migrations/$${n}_$(NAME).{up,down}.sql"

keys:
	@mkdir -p keys
	@if [ -f keys/jwt_private.pem ]; then \
	  echo "keys/jwt_private.pem already exists — leaving it alone"; \
	else \
	  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out keys/jwt_private.pem; \
	  openssl rsa -pubout -in keys/jwt_private.pem -out keys/jwt_public.pem; \
	  echo "wrote keys/jwt_{private,public}.pem"; \
	fi

seed-foods:
	DATABASE_URL="$(DATABASE_URL)" go run ./cmd/seed-foods -dir ./seed/foods

seed-foods-dry-run:
	go run ./cmd/seed-foods -dir ./seed/foods -dry-run
