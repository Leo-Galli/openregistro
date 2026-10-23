# Configuration

OpenRegistro is configured through environment variables. See `apps/web/.env.example` for
the authoritative, always-up-to-date list - this page explains what each one does.

| Variable                                                                | Required                   | Description                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STORAGE_DRIVER`                                                        | yes                        | `json` or `postgres`. Chosen once during the setup wizard; the installer records which driver was used.                                                                                                                                                                                                                                      |
| `DATA_DIR`                                                              | only for `json`            | Directory for JSON data files. Defaults to `./data` if unset.                                                                                                                                                                                                                                                                                |
| `DATABASE_URL`                                                          | only for `postgres`        | Postgres connection string. Run `pnpm --filter @openregistro/db db:migrate` with this set before first use.                                                                                                                                                                                                                                  |
| `AUTH_SECRET`                                                           | yes                        | Session encryption secret for Auth.js. Generate with `openssl rand -base64 32`. Rotating it invalidates all existing sessions.                                                                                                                                                                                                               |
| `AUTH_URL`                                                              | recommended behind a proxy | Public base URL of the deployment. Auth.js can often infer it from request headers, but setting it explicitly avoids surprises behind reverse proxies/load balancers.                                                                                                                                                                        |
| `NODE_ENV`                                                              | no                         | `development`, `production`, or `test`. Set automatically by the relevant `pnpm`/Docker commands.                                                                                                                                                                                                                                            |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | no                         | Reference only. The live SMTP configuration is entered through the setup wizard's SMTP step (or a future settings screen) and stored via the active storage driver, not read from these env vars at runtime - see `apps/web/lib/mailer.ts`. Leaving SMTP unset disables outgoing email; the app still works, the wizard step can be skipped. |

## Storage driver selection

`STORAGE_DRIVER` is fixed for the lifetime of a deployment through normal use - there is no
in-app toggle to switch drivers live, because the two drivers' data directories/databases
are entirely separate. To move from `json` to `postgres`, use the migration script described
in [Backups](./backups.md), then change `STORAGE_DRIVER` (and add `DATABASE_URL`) and
restart the app.

## Secrets

Never commit real values for `AUTH_SECRET`, `DATABASE_URL`, or `SMTP_PASSWORD` to version
control. `.env` files are gitignored; use your deployment platform's secret management
(Docker Compose `.env` file, a secrets manager, etc.) in production.
