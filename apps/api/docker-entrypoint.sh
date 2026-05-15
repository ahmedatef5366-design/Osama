#!/usr/bin/env bash
# Entrypoint for the Osama API container.
#
# 1. Apply pending Postgres migrations. Uses MIGRATE_DATABASE_URL when set
#    (Supabase session-mode pooler — supports DDL and provides IPv4
#    connectivity required by Render). Falls back to DATABASE_URL for hosts
#    that don't differentiate.
# 2. Exec the API binary (or whatever was passed as CMD).
set -euo pipefail

# URL-encode the password portion of a postgres(ql):// URL.
# golang-migrate uses Go's net/url.Parse which rejects unencoded characters
# like '/' or '@' inside the password.  Supabase (and others) may generate
# passwords containing those characters.
url_encode_password() {
  local url="$1"
  # Match:  scheme://user:password@hostAndRest
  # (.+) before the last '@' is greedy, so it correctly captures passwords
  # that themselves contain '@'.
  if [[ "$url" =~ ^(postgres(ql)?://)([^:@]+):(.+)@([^@]+)$ ]]; then
    local scheme="${BASH_REMATCH[1]}"
    local user="${BASH_REMATCH[3]}"
    local pass="${BASH_REMATCH[4]}"
    local rest="${BASH_REMATCH[5]}"

    local encoded="" i c
    for (( i = 0; i < ${#pass}; i++ )); do
      c="${pass:i:1}"
      case "$c" in
        [A-Za-z0-9._~-]) encoded+="$c" ;;
        *) printf -v c '%%%02X' "'$c"; encoded+="$c" ;;
      esac
    done

    printf '%s%s:%s@%s' "$scheme" "$user" "$encoded" "$rest"
  else
    printf '%s' "$url"
  fi
}

MIGRATE_URL="${MIGRATE_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo "ERROR: neither MIGRATE_DATABASE_URL nor DATABASE_URL is set" >&2
  exit 1
fi

# Ensure special characters in the password are percent-encoded.
MIGRATE_URL="$(url_encode_password "${MIGRATE_URL}")"

if [[ "${RUN_MIGRATIONS:-true}" == "true" ]]; then
  echo "→ applying migrations against ${MIGRATE_URL%%@*}@…"
  if ! migrate -path /app/migrations -database "${MIGRATE_URL}" up 2>&1; then
    # Surface a helpful hint when the failure looks like an IPv6 issue with
    # Supabase's direct-connection hostname (db.*.supabase.co is IPv6-only
    # and Render free-tier lacks IPv6 outbound connectivity).
    if [[ "${MIGRATE_URL}" == *"db."*".supabase.co"* ]]; then
      echo "" >&2
      echo "HINT: db.<project>.supabase.co is IPv6-only. Render's free tier" >&2
      echo "does not support IPv6. Use the Supabase *Session-mode* pooler" >&2
      echo "for MIGRATE_DATABASE_URL instead:" >&2
      echo "  postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" >&2
      echo "(Supabase Dashboard → Settings → Database → Connection Pooling → Session mode)" >&2
    fi
    exit 1
  fi
else
  echo "→ RUN_MIGRATIONS=false, skipping migrate"
fi

echo "→ starting API"
exec "$@"
