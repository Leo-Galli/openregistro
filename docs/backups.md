# Backups and restore

## Backup

```bash
# JSON driver (default)
STORAGE_DRIVER=json DATA_DIR=./data pnpm backup

# Postgres
STORAGE_DRIVER=postgres DATABASE_URL=postgres://... pnpm backup
```

This runs `scripts/backup.sh`, which writes a timestamped archive into `backups/`
(`openregistro-json-<timestamp>.tar.gz` or `openregistro-postgres-<timestamp>.sql`, the
latter via `pg_dump`). The `backups/` directory is created if it doesn't exist; add it to
your own off-host backup rotation (it is gitignored, OpenRegistro does not upload backups
anywhere itself).

## Restore

```bash
STORAGE_DRIVER=json DATA_DIR=./data pnpm restore backups/openregistro-json-<timestamp>.tar.gz
STORAGE_DRIVER=postgres DATABASE_URL=postgres://... pnpm restore backups/openregistro-postgres-<timestamp>.sql
```

Restoring the JSON driver overwrites `DATA_DIR`'s current contents. Restoring Postgres runs
the dump through `psql` inside a single transaction. Stop the app before restoring to avoid
writes racing the restore.

## Moving from JSON to Postgres

A one-way migration copies every record from a JSON data directory into a Postgres database
through the same `StorageDriver` contract both drivers implement:

```bash
# 1. Apply migrations to the (empty) target database first.
DATABASE_URL=postgres://... pnpm --filter @openregistro/db db:migrate

# 2. Copy the data.
DATA_DIR=./data DATABASE_URL=postgres://... pnpm migrate:json-to-postgres
```

This is implemented in `apps/web/scripts/migrate-json-to-postgres.ts`. Technical note: the
`StorageDriver.create()` methods always generate a fresh id server-side (ids are never
accepted from the caller - see the repository factories under `packages/db/src`), so a
naive record-by-record copy would break every foreign key. The script instead builds an
old-id -> new-id map as it creates each entity and substitutes mapped ids into every
dependent record, in dependency order (schools, then school years, terms, classes, subjects,
users, and so on down to the audit log). Absence justifications that were already
approved/rejected in the source data have their review decision replayed through
`absenceJustifications.review()` after creation, since the create-only API only accepts a
"pending" initial state - the one side effect of this is that the migrated record's
`reviewedAt` timestamp becomes the migration time rather than the original review time.

Run this once against a freshly migrated (empty) Postgres database - it does not de-duplicate
against existing rows if run twice.

## Demo instance reset

```bash
STORAGE_DRIVER=json DATA_DIR=./data pnpm demo:reset
```

Wipes storage (deletes `DATA_DIR`, or drops and recreates the `public` schema for Postgres)
and reseeds the fictional demo dataset, then marks the installer complete so the instance is
immediately usable again without re-running the setup wizard. Intended for public demo
deployments that should reset to a known state on a schedule.
