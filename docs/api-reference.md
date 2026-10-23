# Server actions reference

OpenRegistro has no general-purpose REST/JSON API - `apps/web` is a single Next.js App
Router application that reads data in React Server Components and mutates it through Server
Actions (functions marked `'use server'`, called directly from forms/client components,
compiled by Next.js into POST handlers under the hood). There is intentionally no OpenAPI
spec here: documenting one would describe internal actions as a stable public contract they
are not. Two real HTTP endpoints do exist for cases a Server Action genuinely can't serve
(binary responses) - see "Route handlers" below.

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

| File                                                          | Actions                                                       | Purpose                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `app/setup/driver/actions.ts`                                 | `testStorageConnection`                                       | Verifies the configured storage driver can connect/write during the setup wizard. |
| `app/setup/school/actions.ts`                                 | `saveSchoolDetails`                                           | Creates/updates the school and current school year during setup.                  |
| `app/setup/admin/actions.ts`                                  | `createAdminAccount`                                          | Creates the first `school_admin` user during setup.                               |
| `app/setup/smtp/actions.ts`                                   | `submitSmtpForm`, `skipSmtpSetup`                             | Persists SMTP settings, or skips the step.                                        |
| `app/setup/demo/actions.ts`                                   | `finishSetup`                                                 | Optionally seeds demo data, then permanently locks the installer.                 |
| `app/login/actions.ts`                                        | `authenticate`                                                | Credentials + optional TOTP sign-in.                                              |
| `app/dashboard/actions.ts`                                    | `logOut`                                                      | Signs the current session out.                                                    |
| `app/dashboard/school/classes/actions.ts`                     | `createClass`                                                 | Creates a class.                                                                  |
| `app/dashboard/school/classes/[classId]/actions.ts`           | `enrollStudent`, `assignTeacher`                              | Enrolls a student in a class; assigns a teacher to a class/subject.               |
| `app/dashboard/school/subjects/actions.ts`                    | `createSubject`                                               | Creates a subject.                                                                |
| `app/dashboard/school/people/actions.ts`                      | `createPerson`                                                | Creates a teacher/student/guardian/staff account.                                 |
| `app/dashboard/school/terms/actions.ts`                       | `createTerm`                                                  | Creates a term for the active school year.                                        |
| `app/dashboard/register/[classId]/actions.ts`                 | `saveLessonLog`, `saveAttendance`                             | Records a signed lesson log entry; saves the attendance grid for a class/date.    |
| `app/dashboard/gradebook/[classId]/[subjectId]/actions.ts`    | `createGrade`                                                 | Records a grade for a student.                                                    |
| `app/dashboard/attendance/actions.ts`                         | `submitJustification`, `reviewJustification`                  | Submits an absence justification; approves/rejects a pending one.                 |
| `app/dashboard/homework/[classId]/[subjectId]/actions.ts`     | `createHomework`, `deleteHomework`                            | Assigns/removes a homework assignment.                                            |
| `app/dashboard/announcements/actions.ts`                      | `createAnnouncement`, `markAnnouncementRead`                  | Publishes an announcement; records a read receipt.                                |
| `app/dashboard/report-cards/[classId]/[subjectId]/actions.ts` | `saveTermEvaluation`                                          | Records a term's final per-subject evaluation.                                    |
| `app/dashboard/school/people/actions.ts`                      | `createPerson`, `setUserActive`                               | Creates an account; deactivates/reactivates one (blocks sign-in, keeps history).  |
| `app/dashboard/account/actions.ts`                            | `startTotpEnrollment`, `confirmTotpEnrollment`, `disableTotp` | TOTP 2FA enrollment for the signed-in user's own account.                         |
| `app/dashboard/discipline/[classId]/actions.ts`               | `createDisciplinaryNote`                                      | Records an immutable disciplinary note for a student.                             |
| `app/dashboard/timetable/[classId]/actions.ts`                | `addTimetableSlot`, `removeTimetableSlot`                     | Adds/removes a weekly timetable slot for a class.                                 |
| `app/dashboard/calendar/actions.ts`                           | `createCalendarEvent`, `deleteCalendarEvent`                  | Publishes/removes a school-wide calendar entry (test, event, or holiday).         |
| `app/dashboard/meetings/actions.ts`                           | `createMeetingSlot`, `deleteMeetingSlot`, `bookMeetingSlot`   | Offers/removes a parent-teacher meeting slot; books one for a child.              |

`app/dashboard/grades/page.tsx` and `app/dashboard/audit-log/page.tsx` are read-only - they
have no `actions.ts`, since nothing on those pages mutates data.

This table reflects the actions present as of this writing - new dashboard features add
their own `actions.ts` following the same pattern described above rather than a shared
generic handler (see the "dialogs must be fully self-contained Client Components" and
`revalidatePath()` conventions noted in the codebase's own working notes for why).

## Route handlers

Two real HTTP endpoints exist, both `GET`-only, both returning a binary response a Server
Action cannot:

| Route                                    | Returns                                | Access control                                                                     |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `/api/report-cards/[studentId]/[termId]` | A PDF report card                      | The student themselves, a guardian of that student, or staff with `reports:read`.  |
| `/api/account/export`                    | A JSON export of the caller's own data | Any signed-in user, always scoped to their own session - there is no id parameter. |

Both re-derive the session with `auth()` independently of whatever page links to them, so
neither trusts the UI that happened to render the link.
