#!/usr/bin/env bash
# Entrypoint for the Osama API container.
#
# 1. Apply pending Postgres migrations. Uses MIGRATE_DATABASE_URL when set
#    (a direct, non-pooled connection — required by Supabase because the
#    transaction pooler rejects DDL like CREATE EXTENSION). Falls back to
#    DATABASE_URL for hosts that don't differentiate.
# 2. Exec the API binary (or whatever was passed as CMD).
set -euo pipefail

MIGRATE_URL="${MIGRATE_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo "ERROR: neither MIGRATE_DATABASE_URL nor DATABASE_URL is set" >&2
  exit 1
fi

if [[ "${RUN_MIGRATIONS:-true}" == "true" ]]; then
  echo "→ applying migrations against ${MIGRATE_URL%%@*}@…"
  migrate -path /app/migrations -database "${MIGRATE_URL}" up
else
  echo "→ RUN_MIGRATIONS=false, skipping migrate"
fi

echo "→ starting API"
exec "$@"
