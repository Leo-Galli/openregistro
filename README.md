# OpenRegistro

[![CI](https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml/badge.svg)](https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE)

Open source, self-hosted school electronic register (gradebook).

> Status: core feature set complete (school records, register, gradebook, absence
> justifications, homework, announcements, report cards, audit log, timetable, disciplinary
> notes, calendar, and parent-teacher meeting booking) and running behind CI. See `docs/`
> for installation and architecture, and [CHANGELOG.md](./CHANGELOG.md) for what's shipped
> so far and what's deliberately still a gap.

## Features

- Role-based access for school admins, secretary staff, principals, teachers, students, and
  guardians, enforced server-side on every action.
- Class register: lesson logs with sign-off, attendance tracking, absence justifications.
- Gradebook with weighted averages, separate end-of-term evaluations, and PDF report cards.
- Homework, school-wide or class-scoped announcements with read receipts, a weekly
  timetable, disciplinary notes, a shared calendar, and parent-teacher meeting booking.
- An audit log for sensitive changes, TOTP two-factor authentication, and a self-service
  personal data export.
- Two storage backends behind one interface: JSON files (no database required) or
  PostgreSQL, selected at install time.

## Monorepo layout

- `apps/web` — the register application (self-hosted by schools)
- `apps/website` — marketing and documentation site
- `packages/ui` — design system
- `packages/core` — domain types, validation, RBAC, storage driver interface
- `packages/db` — storage drivers (`json`, `postgres`)
- `docker/`, `scripts/`, `docs/` — deployment, operations, documentation

## Quick start

```bash
pnpm install
pnpm dev:json
```

No database required for `dev:json` — data is stored as JSON files under `data/`.

For a production-like stack with PostgreSQL:

```bash
docker compose up
```

Or a database-free Docker setup using the JSON driver:

```bash
docker compose -f docker-compose.json.yml up
```

## Documentation

- [Installation](./docs/installation.md)
- [Configuration](./docs/configuration.md)
- [Architecture](./docs/architecture.md)
- [Backups](./docs/backups.md)
- [GDPR / data protection notes](./docs/gdpr.md)
- [Server actions reference](./docs/api-reference.md)

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
