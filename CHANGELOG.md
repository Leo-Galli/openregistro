# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Monorepo scaffold: pnpm workspaces + Turborepo, shared TypeScript/ESLint/Prettier config
  (`packages/config`).
- Domain model, Zod validation schemas, RBAC permission model, and the `StorageDriver`
  interface shared by both storage backends (`packages/core`).
- JSON file-based storage driver (atomic writes, file locking) and PostgreSQL storage driver
  (Drizzle ORM), both passing the same contract test suite (`packages/db`).
- Design system: tokens, Tailwind v4 theme, and a Radix-based component library
  (`packages/ui`).
- Register application (`apps/web`): Auth.js credentials login with optional TOTP, a
  first-run setup wizard (storage driver, school details, admin account, SMTP, demo data),
  role-based access control enforced server-side on every mutation.
- School records management: classes, subjects, teacher/student/guardian accounts,
  enrollments, teacher assignments, school years and terms.
- Class register: lesson log with per-lesson sign-off, attendance grid (present / absent /
  late / early leave).
- Gradebook: weighted grade entry and per-student averages.
- Absence justifications: students/guardians submit a justification for an absence, staff
  with the review permission approve or reject it.
- Operational scripts: backup/restore for both storage drivers, JSON-to-Postgres migration,
  demo data reset, a release helper.
- Docker image (multi-stage, non-root, healthcheck) and Compose files for both storage
  drivers.
- CI: lint/typecheck/build, a Postgres-backed test job, an e2e job, CodeQL analysis, and a
  GHCR image publish workflow.
- Project documentation under `docs/` (installation, configuration, architecture, backups,
  GDPR notes) and community files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`).

### Known gaps

- Student/guardian read-only views, announcements, report card PDF export, the audit log
  viewer, and the timetable are tracked as in-progress or not-yet-started work - see the
  project roadmap for current status.
- TOTP enrollment has no settings-page UI yet (the backend and login-time verification are
  done).
