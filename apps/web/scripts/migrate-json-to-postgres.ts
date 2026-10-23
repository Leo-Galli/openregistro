import { createJsonStorageDriver, createPostgresStorageDriver } from '@openregistro/db';
import type {
  StorageDriver,
  SchoolId,
  SchoolYearId,
  TermId,
  ClassId,
  SubjectId,
  UserId,
  AttendanceRecordId,
  AbsenceJustificationId,
  GradeId,
  DisciplinaryNoteId,
  TermEvaluationId,
  MeetingSlotId,
  AnnouncementId,
} from '@openregistro/core';

/**
 * One-way copy of every record from a JSON-driver data directory into a
 * Postgres database, through the same `StorageDriver` interface the app
 * itself uses (both drivers implement an identical contract).
 *
 * `create()` always assigns a fresh id (see the repository factories under
 * `packages/db/src` - ids are generated server-side, never accepted from the caller), so a plain
 * record-by-record copy would silently break every foreign key. This script
 * instead builds an old-id -> new-id map as it goes and substitutes mapped ids
 * into every dependent record before creating it, in dependency order.
 *
 * Run with `pnpm --filter @openregistro/web exec tsx scripts/migrate-json-to-postgres.ts`,
 * or via `pnpm migrate:json-to-postgres` from the repo root (see scripts/migrate-json-to-postgres.sh).
 * The target database must already have migrations applied
 * (`pnpm --filter @openregistro/db db:migrate`).
 */

async function main(): Promise<void> {
  const dataDir = process.env.DATA_DIR ?? './data';
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to the target Postgres database.');
  }

  const source = createJsonStorageDriver({ dataDir });
  const target = createPostgresStorageDriver({ connectionString: databaseUrl });

  await source.connect();
  await target.connect();

  try {
    await migrate(source, target);
    console.warn('Migration from JSON to Postgres completed successfully.');
  } finally {
    await source.disconnect();
    await target.disconnect();
  }
}

async function migrate(source: StorageDriver, target: StorageDriver): Promise<void> {
  const schoolIdMap = new Map<SchoolId, SchoolId>();
  const schoolYearIdMap = new Map<SchoolYearId, SchoolYearId>();
  const termIdMap = new Map<TermId, TermId>();
  const classIdMap = new Map<ClassId, ClassId>();
  const subjectIdMap = new Map<SubjectId, SubjectId>();
  const userIdMap = new Map<UserId, UserId>();
  const attendanceRecordIdMap = new Map<AttendanceRecordId, AttendanceRecordId>();
  const absenceJustificationIdMap = new Map<AbsenceJustificationId, AbsenceJustificationId>();
  const gradeIdMap = new Map<GradeId, GradeId>();
  const disciplinaryNoteIdMap = new Map<DisciplinaryNoteId, DisciplinaryNoteId>();
  const termEvaluationIdMap = new Map<TermEvaluationId, TermEvaluationId>();
  const meetingSlotIdMap = new Map<MeetingSlotId, MeetingSlotId>();
  const announcementIdMap = new Map<AnnouncementId, AnnouncementId>();

  function mapped<K>(map: Map<K, K>, oldId: K, label: string): K {
    const newId = map.get(oldId);
    if (!newId) throw new Error(`Migration error: no mapped id for ${label} ${String(oldId)}`);
    return newId;
  }

  console.warn('Migrating schools...');
  for (const school of await source.schools.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = school;
    const created = await target.schools.create(rest);
    schoolIdMap.set(id, created.id);
  }

  console.warn('Migrating school years...');
  for (const schoolYear of await source.schoolYears.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = schoolYear;
    const created = await target.schoolYears.create({
      ...rest,
      schoolId: mapped(schoolIdMap, rest.schoolId, 'school'),
    });
    schoolYearIdMap.set(id, created.id);
  }

  console.warn('Migrating terms...');
  for (const term of await source.terms.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = term;
    const created = await target.terms.create({
      ...rest,
      schoolYearId: mapped(schoolYearIdMap, rest.schoolYearId, 'school year'),
    });
    termIdMap.set(id, created.id);
  }

  console.warn('Migrating classes...');
  for (const klass of await source.classes.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = klass;
    const created = await target.classes.create({
      ...rest,
      schoolId: mapped(schoolIdMap, rest.schoolId, 'school'),
      schoolYearId: mapped(schoolYearIdMap, rest.schoolYearId, 'school year'),
    });
    classIdMap.set(id, created.id);
  }

  console.warn('Migrating subjects...');
  for (const subject of await source.subjects.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = subject;
    const created = await target.subjects.create({
      ...rest,
      schoolId: mapped(schoolIdMap, rest.schoolId, 'school'),
    });
    subjectIdMap.set(id, created.id);
  }

  console.warn('Migrating users...');
  for (const user of await source.users.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = user;
    const created = await target.users.create({
      ...rest,
      schoolId: mapped(schoolIdMap, rest.schoolId, 'school'),
    });
    userIdMap.set(id, created.id);
  }

  console.warn('Migrating teacher assignments...');
  for (const assignment of await source.teacherAssignments.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = assignment;
    await target.teacherAssignments.create({
      ...rest,
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
      classId: mapped(classIdMap, rest.classId, 'class'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
    });
  }

  console.warn('Migrating enrollments...');
  for (const enrollment of await source.enrollments.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = enrollment;
    await target.enrollments.create({
      ...rest,
      studentId: mapped(userIdMap, rest.studentId, 'user'),
      classId: mapped(classIdMap, rest.classId, 'class'),
      schoolYearId: mapped(schoolYearIdMap, rest.schoolYearId, 'school year'),
    });
  }

  console.warn('Migrating guardianships...');
  for (const guardianship of await source.guardianships.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = guardianship;
    await target.guardianships.create({
      ...rest,
      guardianId: mapped(userIdMap, rest.guardianId, 'user'),
      studentId: mapped(userIdMap, rest.studentId, 'user'),
    });
  }

  console.warn('Migrating lesson logs...');
  for (const lessonLog of await source.lessonLogs.findMany()) {
    const {
      id: _id,
      signedAt: _signedAt,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = lessonLog;
    await target.lessonLogs.create({
      ...rest,
      classId: mapped(classIdMap, rest.classId, 'class'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
    });
  }

  console.warn('Migrating attendance records...');
  for (const record of await source.attendanceRecords.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = record;
    const created = await target.attendanceRecords.create({
      ...rest,
      studentId: mapped(userIdMap, rest.studentId, 'user'),
      classId: mapped(classIdMap, rest.classId, 'class'),
      recordedBy: mapped(userIdMap, rest.recordedBy, 'user'),
    });
    attendanceRecordIdMap.set(id, created.id);
  }

  console.warn('Migrating absence justifications...');
  for (const justification of await source.absenceJustifications.findMany()) {
    const {
      id,
      status,
      reviewedBy,
      reviewedAt: _reviewedAt,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = justification;
    const created = await target.absenceJustifications.create({
      ...rest,
      attendanceRecordId: mapped(
        attendanceRecordIdMap,
        rest.attendanceRecordId,
        'attendance record',
      ),
      submittedBy: mapped(userIdMap, rest.submittedBy, 'user'),
    });
    absenceJustificationIdMap.set(id, created.id);
    // create() always starts a justification as "pending" (see
    // createAbsenceJustificationInputSchema) - replay the review decision
    // through review() so an already-approved/rejected justification keeps
    // its outcome. reviewedAt is necessarily regenerated to "now" since
    // review() does not accept an explicit timestamp.
    if (status !== 'pending' && reviewedBy) {
      await target.absenceJustifications.review(
        created.id,
        status,
        mapped(userIdMap, reviewedBy, 'user'),
      );
    }
  }

  console.warn('Migrating grades...');
  for (const grade of await source.grades.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = grade;
    const created = await target.grades.create({
      ...rest,
      studentId: mapped(userIdMap, rest.studentId, 'user'),
      classId: mapped(classIdMap, rest.classId, 'class'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
      termId: mapped(termIdMap, rest.termId, 'term'),
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
    });
    gradeIdMap.set(id, created.id);
  }

  console.warn('Migrating disciplinary notes...');
  for (const note of await source.disciplinaryNotes.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = note;
    const created = await target.disciplinaryNotes.create({
      ...rest,
      studentId: mapped(userIdMap, rest.studentId, 'user'),
      classId: mapped(classIdMap, rest.classId, 'class'),
      authorId: mapped(userIdMap, rest.authorId, 'user'),
    });
    disciplinaryNoteIdMap.set(id, created.id);
  }

  console.warn('Migrating homework assignments...');
  for (const homework of await source.homeworkAssignments.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = homework;
    await target.homeworkAssignments.create({
      ...rest,
      classId: mapped(classIdMap, rest.classId, 'class'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
    });
  }

  console.warn('Migrating timetable slots...');
  for (const slot of await source.timetableSlots.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = slot;
    await target.timetableSlots.create({
      ...rest,
      classId: mapped(classIdMap, rest.classId, 'class'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
    });
  }

  console.warn('Migrating calendar events...');
  for (const event of await source.calendarEvents.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = event;
    await target.calendarEvents.create({
      ...rest,
      classId: rest.classId ? mapped(classIdMap, rest.classId, 'class') : null,
      subjectId: rest.subjectId ? mapped(subjectIdMap, rest.subjectId, 'subject') : null,
      createdBy: mapped(userIdMap, rest.createdBy, 'user'),
    });
  }

  console.warn('Migrating meeting slots...');
  for (const slot of await source.meetingSlots.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = slot;
    const created = await target.meetingSlots.create({
      ...rest,
      teacherId: mapped(userIdMap, rest.teacherId, 'user'),
    });
    meetingSlotIdMap.set(id, created.id);
  }

  console.warn('Migrating meeting bookings...');
  for (const booking of await source.meetingBookings.findMany()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = booking;
    await target.meetingBookings.create({
      ...rest,
      meetingSlotId: mapped(meetingSlotIdMap, rest.meetingSlotId, 'meeting slot'),
      guardianId: mapped(userIdMap, rest.guardianId, 'user'),
      studentId: mapped(userIdMap, rest.studentId, 'user'),
    });
  }

  console.warn('Migrating announcements...');
  for (const announcement of await source.announcements.findMany()) {
    const {
      id,
      publishedAt: _publishedAt,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = announcement;
    const created = await target.announcements.create({
      ...rest,
      schoolId: mapped(schoolIdMap, rest.schoolId, 'school'),
      classId: rest.classId ? mapped(classIdMap, rest.classId, 'class') : null,
      authorId: mapped(userIdMap, rest.authorId, 'user'),
    });
    announcementIdMap.set(id, created.id);
  }

  console.warn('Migrating announcement read receipts...');
  for (const receipt of await source.announcementReadReceipts.findMany()) {
    const { id: _id, readAt: _readAt, ...rest } = receipt;
    await target.announcementReadReceipts.create({
      ...rest,
      announcementId: mapped(announcementIdMap, rest.announcementId, 'announcement'),
      userId: mapped(userIdMap, rest.userId, 'user'),
    });
  }

  console.warn('Migrating term evaluations...');
  for (const evaluation of await source.termEvaluations.findMany()) {
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = evaluation;
    const created = await target.termEvaluations.create({
      ...rest,
      studentId: mapped(userIdMap, rest.studentId, 'user'),
      subjectId: mapped(subjectIdMap, rest.subjectId, 'subject'),
      termId: mapped(termIdMap, rest.termId, 'term'),
      decidedBy: mapped(userIdMap, rest.decidedBy, 'user'),
    });
    termEvaluationIdMap.set(id, created.id);
  }

  console.warn('Migrating audit log...');
  const auditEntityIdMaps: Record<string, Map<string, string> | undefined> = {
    grade: gradeIdMap,
    attendance_record: attendanceRecordIdMap,
    absence_justification: absenceJustificationIdMap,
    disciplinary_note: disciplinaryNoteIdMap,
    term_evaluation: termEvaluationIdMap,
    user: userIdMap,
  };
  for (const entry of await source.auditLog.findMany()) {
    const { id: _id, createdAt: _createdAt, ...rest } = entry;
    const entityIdMap = auditEntityIdMaps[rest.entityKind];
    const mappedEntityId = entityIdMap?.get(rest.entityId) ?? rest.entityId;
    await target.auditLog.create({
      ...rest,
      actorId: mapped(userIdMap, rest.actorId, 'user'),
      entityId: mappedEntityId,
    });
  }

  console.warn('Migrating app settings...');
  const settings = await source.settings.get();
  if (settings.smtp) {
    await target.settings.update({ smtp: settings.smtp });
  }

  console.warn('Migrating installer state...');
  const installerState = await source.installer.get();
  if (installerState.completed) {
    await target.installer.complete('postgres');
  }
}

main().catch((error: unknown) => {
  console.error(
    'Migration from JSON to Postgres failed:',
    error instanceof Error ? error.stack : error,
  );
  process.exitCode = 1;
});
