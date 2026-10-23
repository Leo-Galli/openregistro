# GDPR and data protection notes

OpenRegistro is self-hosted software for schools - the school running it is the data
controller, not the OpenRegistro project. This page documents what the software does today
to support that responsibility, and where the gaps are, honestly.

## What personal data is stored

See `packages/core/src/domain/*.ts` for the authoritative schemas. In summary:

- **Users** (`domain/user.ts`): full name, email, Argon2id password hash, optional TOTP
  secret, role, active status, last login timestamp. No more than this is collected at
  signup.
- **Register data** (`domain/register.ts`, `domain/grades.ts`): attendance records, lesson
  logs, grades, absence justifications (free-text reason), disciplinary notes, homework
  assignments - all linked to a student's user id, not a separate identity record.
- **Guardianship links** (`domain/academic-structure.ts`): which guardian accounts are
  responsible for which student accounts.
- **Announcements and read receipts** (`domain/announcements.ts`): who published what, and
  who has read it.
- **Audit log** (`domain/audit.ts`): append-only record of create/update/delete actions on
  sensitive entities (grades, attendance, justifications, disciplinary notes, term
  evaluations, user records), storing the actor, a before/after snapshot, and a timestamp.

Data minimization in practice: optional fields are nullable rather than required-with-a-
placeholder (e.g. a school's address/logo, a user's TOTP secret), and the demo seed data
(`apps/web/lib/seed-demo.ts`) is entirely fictional, never real student data.

## Data subject rights: current support

Being direct about where this stands:

- **Access/export**: there is no self-service "export my data" feature in the app yet. An
  administrator with direct access to the storage backend can extract a user's records (the
  JSON driver stores plain files per entity type; the Postgres driver is a normal relational
  database queryable with SQL), but there is no in-app button for this. Tracked as a gap, not
  silently assumed to exist.
- **Erasure**: there is no in-app "delete this user and their data" action yet.
  `users: CrudRepository` does expose a `delete()` method, but nothing in the UI calls it, and
  deleting a user without deciding what happens to their historical grades/attendance records
  (which reference the user id as a foreign key) needs a deliberate retention policy, not just
  a row delete. This is a known gap, not a built feature.
- **Rectification**: covered for most editable fields through normal admin UI (editing a
  person's details) where that UI exists; not yet audited field-by-field.

If your deployment has a legal obligation to honor these requests today, the data access
paths above (direct storage access) are the only mechanism available until a self-service
flow is built.

## Record of processing (template)

Fill this in for your own deployment - the project does not maintain this on your behalf,
since it depends on your school's specific configuration (which SMTP provider, which
hosting, etc.):

| Processing activity    | Data categories                                                                       | Purpose                                 | Retention                                                                            | Recipients                            |
| ---------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------- |
| Account management     | Name, email, password hash                                                            | Authenticating staff/students/guardians | For the duration of enrollment/employment plus your school's record-retention policy | None outside the deployment           |
| Attendance and grading | Attendance status, grades, lesson topics                                              | Academic record-keeping                 | Per your jurisdiction's school-record retention rules                                | None outside the deployment           |
| Communications         | Announcement content, read receipts, (optional) outgoing email via your SMTP provider | Parent/staff communication              | Per your retention policy                                                            | Your configured SMTP provider, if set |

## Security measures already in place

- Passwords hashed with Argon2id, never stored or logged in plain text.
- Every mutating server action re-validates input with Zod and re-checks authorization
  server-side (see [Architecture](./architecture.md)).
- Security-relevant HTTP headers set on every response (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` - see `apps/web/next.config.ts`).
- Login rate limiting (in-memory, per attempted email - see known limitations in the app's
  own notes about single-process deployments).
- Optional TOTP two-factor authentication.
