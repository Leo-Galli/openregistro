#!/usr/bin/env bash
# Reset a demo instance to a clean, freshly-seeded state. Intended for public
# demo deployments where every visitor should start from the same fictional
# dataset (see apps/web/lib/seed-demo.ts - every demo record uses a
# @demo.openregistro.local email address, no real person's data).
#
# STORAGE_DRIVER=json (default): deletes DATA_DIR entirely, then reseeds.
# STORAGE_DRIVER=postgres: drops and recreates the public schema, reapplies
#   migrations, then reseeds.
#
# Usage: STORAGE_DRIVER=json DATA_DIR=./data scripts/demo-reset.sh
set -euo pipefail

STORAGE_DRIVER="${STORAGE_DRIVER:-json}"

case "$STORAGE_DRIVER" in
  json)
    DATA_DIR="${DATA_DIR:-./data}"
    rm -rf "$DATA_DIR"
    echo "Cleared JSON data directory '$DATA_DIR'."
    ;;
  postgres)
    if [ -z "${DATABASE_URL:-}" ]; then
      echo "error: DATABASE_URL must be set when STORAGE_DRIVER=postgres." >&2
      exit 1
    fi
    if ! command -v psql >/dev/null 2>&1; then
      echo "error: psql not found on PATH. Install the PostgreSQL client tools." >&2
      exit 1
    fi
    psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    echo "Dropped and recreated the public schema."
    pnpm --filter @openregistro/db db:migrate
    ;;
  *)
    echo "error: unknown STORAGE_DRIVER '$STORAGE_DRIVER' (expected 'json' or 'postgres')." >&2
    exit 1
    ;;
esac

# seedDemoData() (apps/web/lib/seed-demo.ts) is idempotent but only inserts
# domain data - it does not touch installer state. Without an explicit
# complete-installer step, a JSON-driver reset (which deletes DATA_DIR
# entirely) would leave the demo instance stuck back on the setup wizard.
pnpm --filter @openregistro/web run seed:demo
pnpm --filter @openregistro/web exec tsx scripts/complete-installer.ts
echo "Demo data reseeded."
