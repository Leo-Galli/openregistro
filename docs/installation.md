# Installation

OpenRegistro supports two storage backends behind the same application: a JSON file driver
that needs no database, and PostgreSQL for production deployments. Pick one at install time
through the setup wizard - switching later requires the JSON-to-Postgres migration script
(see [Backups](./backups.md)).

## Option A: no database (JSON driver)

Good for trying the app, a single small school, or local development.

```bash
pnpm install
pnpm dev:json
```

This starts the app on `http://localhost:3000` with `STORAGE_DRIVER=json` and data written
to `./data`. Open the URL in a browser - you will land on the first-run setup wizard.

For a containerized version of the same thing:

```bash
cp apps/web/.env.example .env   # set AUTH_SECRET at minimum
docker compose -f docker-compose.json.yml up
```

## Option B: PostgreSQL

Recommended for any deployment with more than a handful of users.

```bash
cp apps/web/.env.example .env   # set AUTH_SECRET at minimum
docker compose up
```

On the very first run against a fresh Postgres volume, apply migrations once before using
the app (see the comment at the top of `docker-compose.yml` for the exact command - the
runtime image is a minimal standalone build and does not include the migration tooling, so
this runs from your host machine with `pnpm` installed).

## The setup wizard

Whichever option you choose, the first visit to the app walks through:

1. **Welcome** (`/setup/welcome`) - a Node.js/environment sanity check.
2. **Storage driver** (`/setup/driver`) - confirms the configured driver can connect/write.
3. **School details** (`/setup/school`) - school name and the current school year's dates.
4. **Administrator account** (`/setup/admin`) - creates the first `school_admin` user.
5. **SMTP** (`/setup/smtp`) - optional; can be skipped and configured later from the app's
   settings (announcements and password-reset email just won't send until this is set).
6. **Demo data** (`/setup/demo`) - optionally loads a fictional demo dataset (see
   `apps/web/lib/seed-demo.ts` - every record uses a `@demo.openregistro.local` address, no
   real person's data).

Once this flow completes, the installer is permanently locked - visiting `/setup/*` again
redirects straight to the dashboard (or to `/login` if not signed in). There is currently no
UI path to re-run the wizard; if you need to start over, see [Backups](./backups.md) for how
to reset storage.

## Reverse proxy / HTTPS

The app does not terminate TLS itself. Put it behind a reverse proxy (Caddy, nginx, Traefik)
that handles HTTPS and forwards to the container's port 3000, and set `AUTH_URL` to the
public HTTPS URL so Auth.js generates correct redirect/callback URLs.
