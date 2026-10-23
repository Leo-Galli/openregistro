#!/usr/bin/env bash
# One-way copy of every record from the JSON driver's data directory into a
# Postgres database. The actual migration logic lives in
# apps/web/scripts/migrate-json-to-postgres.ts (it needs both drivers
# connected at once, which the app's single-STORAGE_DRIVER config does not
# support, so it talks to DATA_DIR and DATABASE_URL directly).
#
# The target database must already have migrations applied:
#   pnpm --filter @openregistro/db db:migrate
#
# Usage: DATA_DIR=./data DATABASE_URL=postgres://... scripts/migrate-json-to-postgres.sh
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL must be set to the target Postgres database." >&2
  exit 1
fi

pnpm --filter @openregistro/web exec tsx scripts/migrate-json-to-postgres.ts
