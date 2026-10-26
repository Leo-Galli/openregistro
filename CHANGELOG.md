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
- Marketing/docs site (`apps/website`): static Next.js export covering the product pitch,
  features, install quick-start, OSS/license rationale, and an FAQ.
- Student/guardian read views for grades and homework; teacher-managed homework per
  class/subject.
- Announcements: school-wide or class-scoped, with per-user read receipts and an optional
  link attachment.
- Term evaluations (separate from the gradebook's computed average) and PDF report card
  export, downloadable by the student, their guardian, or staff.
- Audit log covering account creation, grade entry, absence-justification review, and term
  evaluation changes, with an admin/principal viewer.
- Weekly timetable: a per-class grid editor for staff, read views for teachers/students/
  guardians.
- Disciplinary notes: an immutable per-student record, visible to the student/guardian it
  concerns and to staff for the relevant class.
- School-wide calendar (tests, events, holidays) and parent-teacher meeting booking (staff
  offer time-boxed slots with a capacity, guardians book one for their child).
- TOTP two-factor authentication enrollment UI (`/dashboard/account`) - generate a QR code,
  confirm a code, enable or disable.
- Self-service personal data export (`/dashboard/account`, GDPR-style) and account
  deactivation (blocks sign-in without deleting historical records).
- A Content-Security-Policy with a per-request nonce for `script-src`, generated in
  `apps/web/proxy.ts`.

### Fixed

- A stored-XSS vector in announcement attachment links (`z.string().url()` alone accepts
  `javascript:` URIs; now restricted to `http(s)`).
- The Docker image build, which failed in CI against real Docker infrastructure
  (`apps/web/public` was referenced by the Dockerfile but never existed).
- The hidden `/cp` operator control panel's password was hashed with SHA-256
  (CodeQL `js/insufficient-password-hash`, CWE-916) - switched to Argon2id, the same
  algorithm already used for real user accounts, via `lib/password.ts`. Operators running
  their own managed instance must regenerate `CP_ADMIN_PASSWORD_HASH` with
  `pnpm --filter @openregistro/web hash-cp-password <password>`.

### Known gaps

- No in-app account/data erasure flow - deactivation (above) blocks access without deleting
  historical academic records, which needs a retention-policy decision left to each school.
  See [GDPR notes](./docs/gdpr.md).
- Full calendar-event scoping to a specific class/subject, and meeting cancellation/
  reschedule, are not built - today's calendar is school-wide only and meeting bookings
  cannot be cancelled once made.
