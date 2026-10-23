#!/usr/bin/env bash
# Back up the active storage driver's data.
#
# STORAGE_DRIVER=json (default): tars DATA_DIR (default ./data) into
#   backups/openregistro-json-<timestamp>.tar.gz
# STORAGE_DRIVER=postgres: runs pg_dump against DATABASE_URL into
#   backups/openregistro-postgres-<timestamp>.sql
#
# Usage: STORAGE_DRIVER=json DATA_DIR=./data scripts/backup.sh
#        STORAGE_DRIVER=postgres DATABASE_URL=postgres://... scripts/backup.sh
set -euo pipefail

STORAGE_DRIVER="${STORAGE_DRIVER:-json}"
OUT_DIR="${BACKUP_DIR:-backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"

case "$STORAGE_DRIVER" in
  json)
    DATA_DIR="${DATA_DIR:-./data}"
    if [ ! -d "$DATA_DIR" ]; then
      echo "error: DATA_DIR '$DATA_DIR' does not exist, nothing to back up." >&2
      exit 1
    fi
    OUT_FILE="$OUT_DIR/openregistro-json-$TIMESTAMP.tar.gz"
    tar -czf "$OUT_FILE" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
    echo "Backed up JSON data directory '$DATA_DIR' to $OUT_FILE"
    ;;
  postgres)
    if [ -z "${DATABASE_URL:-}" ]; then
      echo "error: DATABASE_URL must be set when STORAGE_DRIVER=postgres." >&2
      exit 1
    fi
    if ! command -v pg_dump >/dev/null 2>&1; then
      echo "error: pg_dump not found on PATH. Install the PostgreSQL client tools." >&2
      exit 1
    fi
    OUT_FILE="$OUT_DIR/openregistro-postgres-$TIMESTAMP.sql"
    pg_dump "$DATABASE_URL" --format=plain --no-owner --no-privileges > "$OUT_FILE"
    echo "Backed up Postgres database to $OUT_FILE"
    ;;
  *)
    echo "error: unknown STORAGE_DRIVER '$STORAGE_DRIVER' (expected 'json' or 'postgres')." >&2
    exit 1
    ;;
esac
