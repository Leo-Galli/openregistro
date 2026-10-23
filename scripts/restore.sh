#!/usr/bin/env bash
# Restore the active storage driver's data from a backup produced by scripts/backup.sh.
#
# Usage: STORAGE_DRIVER=json DATA_DIR=./data scripts/restore.sh backups/openregistro-json-<timestamp>.tar.gz
#        STORAGE_DRIVER=postgres DATABASE_URL=postgres://... scripts/restore.sh backups/openregistro-postgres-<timestamp>.sql
set -euo pipefail

STORAGE_DRIVER="${STORAGE_DRIVER:-json}"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "usage: STORAGE_DRIVER=$STORAGE_DRIVER scripts/restore.sh <backup-file>" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "error: backup file '$BACKUP_FILE' not found." >&2
  exit 1
fi

case "$STORAGE_DRIVER" in
  json)
    DATA_DIR="${DATA_DIR:-./data}"
    if [ -d "$DATA_DIR" ]; then
      echo "warning: '$DATA_DIR' already exists and will be overwritten by the backup contents." >&2
    fi
    mkdir -p "$(dirname "$DATA_DIR")"
    tar -xzf "$BACKUP_FILE" -C "$(dirname "$DATA_DIR")"
    echo "Restored JSON data directory from $BACKUP_FILE into $DATA_DIR"
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
    psql "$DATABASE_URL" --single-transaction --file "$BACKUP_FILE"
    echo "Restored Postgres database from $BACKUP_FILE"
    ;;
  *)
    echo "error: unknown STORAGE_DRIVER '$STORAGE_DRIVER' (expected 'json' or 'postgres')." >&2
    exit 1
    ;;
esac
