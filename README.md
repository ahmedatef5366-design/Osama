# Osama — Online Coaching Platform

> Production-grade coaching platform: Go (Fiber) API + Next.js 14 web, PostgreSQL/TimescaleDB, Redis, JWT RS256 auth, Arabic RTL + English.

This repo contains the **Phase 1 foundation** of the platform — the monorepo skeleton, design system, database schema, JWT auth, and base API routes. See [BUILD ORDER](#build-order) for the remaining phases.

## Repo layout

```
.
├── apps/
│   ├── web/                # Next.js 14 (App Router, RSC, Tailwind, next-intl)
│   └── api/                # Go 1.22 (Fiber, pgx, sqlc, RS256 JWT, zap)
├── docker-compose.yml      # Local Postgres + Redis
└── .github/workflows/      # CI (lint, typecheck, build, test)
```

## Prerequisites

- Node.js `>= 20.11.1` (`.nvmrc` provided)
- pnpm `>= 9.0.0`
- Go `>= 1.22`
- Docker (for local Postgres + Redis)
- `golang-migrate` (`go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`)
- `sqlc` (optional; only needed if you change `apps/api/internal/db/queries/*.sql`)

## First-time setup

```bash
# 1. Install JS workspace dependencies
pnpm install

# 2. Spin up Postgres + Redis
pnpm db:up

# 3. Generate the RS256 keypair the API needs for JWTs
mkdir -p apps/api/keys
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
  -out apps/api/keys/jwt_private.pem
openssl rsa -pubout -in apps/api/keys/jwt_private.pem \
  -out apps/api/keys/jwt_public.pem

# 4. Copy env templates and fill in the gaps
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 5. Run migrations
pnpm migrate:up

# 6. Start API + web in two shells
pnpm dev:api      # http://localhost:8080
pnpm dev:web      # http://localhost:3000
```

## Environment

The API reads everything from environment variables — never hardcode secrets.

| Variable                | Required | Example                                       |
| ----------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`          | yes      | `postgres://osama:osama@localhost:5432/osama` |
| `REDIS_URL`             | yes      | `redis://localhost:6379/0`                    |
| `JWT_PRIVATE_KEY_PATH`  | yes      | `./keys/jwt_private.pem`                      |
| `JWT_PUBLIC_KEY_PATH`   | yes      | `./keys/jwt_public.pem`                       |
| `ACCESS_TOKEN_TTL`      | no       | `15m`                                         |
| `REFRESH_TOKEN_TTL`     | no       | `720h` (30 days)                              |
| `CORS_ORIGINS`          | no       | `http://localhost:3000`                       |
| `RATE_LIMIT_PER_MINUTE` | no       | `100`                                         |
| `PORT`                  | no       | `8080`                                        |
| `ENV`                   | no       | `development`                                 |
| `COOKIE_DOMAIN`         | no       | `localhost`                                   |
| `COOKIE_SECURE`         | no       | `false` (must be `true` in prod)              |

The web app expects:

| Variable             | Required | Example                 |
| -------------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`| yes      | `http://localhost:8080` |

## A note on TimescaleDB

The spec calls for TimescaleDB hypertables on `weight_log` and `body_measurements`. **Neon serverless Postgres does not support the timescaledb extension.** Migration `0005_progress.up.sql` detects whether the extension is available at runtime and only calls `create_hypertable` when it is — so the same migrations run cleanly on TimescaleDB Cloud, self-hosted Postgres-with-Timescale, **and** Neon (with regular tables as a fallback). If you need hypertables in production, host Postgres somewhere that supports the extension.

## Scripts

```bash
# Web
pnpm dev:web          # next dev
pnpm build:web        # next build
pnpm lint:web         # eslint
pnpm typecheck:web    # tsc --noEmit

# API
pnpm dev:api          # go run ./cmd/server (with .env)
pnpm build:api        # go build -> apps/api/bin/server
pnpm lint:api         # gofmt + go vet (+ golangci-lint if installed)
pnpm test:api         # go test ./...
pnpm migrate:up
pnpm migrate:down

# Infra
pnpm db:up            # docker compose up -d postgres redis
pnpm db:down
pnpm db:reset         # nuke volumes and restart
```

## Build order

```
[x] Phase 1 — Foundation: monorepo, design system, DB schema, JWT auth, base routes
[ ] Phase 2 — Public Face: landing page sections, CMS endpoints + editor, ISR
[ ] Phase 3 — Admin Core: client management, workout plan builder, nutrition builder
[ ] Phase 4 — Client Portal: PWA, today's workout, rest timer (WS), nutrition rings
[ ] Phase 5 — Intelligence: check-in, monitoring dashboard, at-risk, cron, email
[ ] Phase 6 — Polish: motion, skeletons, RTL pass, offline, Lighthouse, security audit
```

## License

Proprietary — all rights reserved.
