# Server actions reference

OpenRegistro has no separate REST/JSON API - `apps/web` is a single Next.js App Router
application that reads data in React Server Components and mutates it through Server
Actions (functions marked `'use server'`, called directly from forms/client components,
compiled by Next.js into POST handlers under the hood). There is intentionally no OpenAPI
spec here: documenting one would describe endpoints that don't exist as a stable public
contract, since these actions are internal to the app, not a versioned external API.

Every action follows the same shape: it re-derives the session with `auth()`, calls
`requirePermission(session, permission)` from `lib/authz.ts` (and, where relevant, a scope
check from `packages/core`'s RBAC module), validates `FormData`/arguments with a Zod schema,
performs the mutation through the active `StorageDriver`, and calls `revalidatePath()` for
every page whose data it affects. See [Architecture](./architecture.md) for the full
request-flow diagram.

If you need programmatic access to OpenRegistro data from outside the app (an integration,
a script), the backing `StorageDriver` interface in `packages/core/src/storage/driver.ts` is
the stable contract to build against directly - see `apps/web/scripts/migrate-json-to-postgres.ts`
for an example of a standalone script driving a `StorageDriver` without going through the
web app at all.

## Action inventory (by file)

| File                                                          | Actions                                      | Purpose                                                                           |
| ------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| `app/setup/driver/actions.ts`                                 | `testStorageConnection`                      | Verifies the configured storage driver can connect/write during the setup wizard. |
| `app/setup/school/actions.ts`                                 | `saveSchoolDetails`                          | Creates/updates the school and current school year during setup.                  |
| `app/setup/admin/actions.ts`                                  | `createAdminAccount`                         | Creates the first `school_admin` user during setup.                               |
| `app/setup/smtp/actions.ts`                                   | `submitSmtpForm`, `skipSmtpSetup`            | Persists SMTP settings, or skips the step.                                        |
| `app/setup/demo/actions.ts`                                   | `finishSetup`                                | Optionally seeds demo data, then permanently locks the installer.                 |
| `app/login/actions.ts`                                        | `authenticate`                               | Credentials + optional TOTP sign-in.                                              |
| `app/dashboard/actions.ts`                                    | `logOut`                                     | Signs the current session out.                                                    |
| `app/dashboard/school/classes/actions.ts`                     | `createClass`                                | Creates a class.                                                                  |
| `app/dashboard/school/classes/[classId]/actions.ts`           | `enrollStudent`, `assignTeacher`             | Enrolls a student in a class; assigns a teacher to a class/subject.               |
| `app/dashboard/school/subjects/actions.ts`                    | `createSubject`                              | Creates a subject.                                                                |
| `app/dashboard/school/people/actions.ts`                      | `createPerson`                               | Creates a teacher/student/guardian/staff account.                                 |
| `app/dashboard/school/terms/actions.ts`                       | `createTerm`                                 | Creates a term for the active school year.                                        |
| `app/dashboard/register/[classId]/actions.ts`                 | `saveLessonLog`, `saveAttendance`            | Records a signed lesson log entry; saves the attendance grid for a class/date.    |
| `app/dashboard/gradebook/[classId]/[subjectId]/actions.ts`    | `createGrade`                                | Records a grade for a student.                                                    |
| `app/dashboard/attendance/actions.ts`                         | `submitJustification`, `reviewJustification` | Submits an absence justification; approves/rejects a pending one.                 |
| `app/dashboard/homework/[classId]/[subjectId]/actions.ts`     | `createHomework`, `deleteHomework`           | Assigns/removes a homework assignment.                                            |
| `app/dashboard/announcements/actions.ts`                      | `createAnnouncement`, `markAnnouncementRead` | Publishes an announcement; records a read receipt.                                |
| `app/dashboard/report-cards/[classId]/[subjectId]/actions.ts` | `saveTermEvaluation`                         | Records a term's final per-subject evaluation.                                    |

This table reflects the actions present as of this writing - new dashboard features add
their own `actions.ts` following the same pattern described above rather than a shared
generic handler (see the "dialogs must be fully self-contained Client Components" and
`revalidatePath()` conventions noted in the codebase's own working notes for why).
