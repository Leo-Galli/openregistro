import { eq } from 'drizzle-orm';
import {
  type StorageDriver,
  type User,
  type UserRecordInput,
  type UpdateUserInput,
  type School,
  type CreateSchoolInput,
  type UpdateSchoolInput,
  type SchoolYear,
  type CreateSchoolYearInput,
  type UpdateSchoolYearInput,
  type Term,
  type CreateTermInput,
  type UpdateTermInput,
  type Class,
  type CreateClassInput,
  type UpdateClassInput,
  type Subject,
  type CreateSubjectInput,
  type UpdateSubjectInput,
  type TeacherAssignment,
  type CreateTeacherAssignmentInput,
  type Enrollment,
  type CreateEnrollmentInput,
  type Guardianship,
  type CreateGuardianshipInput,
  type LessonLog,
  type CreateLessonLogInput,
  type UpdateLessonLogInput,
  type AttendanceRecord,
  type CreateAttendanceRecordInput,
  type UpdateAttendanceRecordInput,
  type AbsenceJustification,
  type AbsenceJustificationId,
  type CreateAbsenceJustificationInput,
  type Grade,
  type CreateGradeInput,
  type UpdateGradeInput,
  type DisciplinaryNote,
  type CreateDisciplinaryNoteInput,
  type HomeworkAssignment,
  type CreateHomeworkAssignmentInput,
  type UpdateHomeworkAssignmentInput,
  type TimetableSlot,
  type CreateTimetableSlotInput,
  type CalendarEvent,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
  type MeetingSlot,
  type CreateMeetingSlotInput,
  type UpdateMeetingSlotInput,
  type MeetingBooking,
  type CreateMeetingBookingInput,
  type Announcement,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
  type AnnouncementReadReceipt,
  type CreateAnnouncementReadReceiptInput,
  type TermEvaluation,
  type CreateTermEvaluationInput,
  type UpdateTermEvaluationInput,
  type AuditLogEntry,
  type CreateAuditLogEntryInput,
  type AppSettings,
  NotFoundError,
  DEFAULT_INSTALLER_STATE,
  installerStateSchema,
  appSettingsSchema,
  userSchema,
  schoolSchema,
  schoolYearSchema,
  termSchema,
  classSchema,
  subjectSchema,
  teacherAssignmentSchema,
  enrollmentSchema,
  guardianshipSchema,
  lessonLogSchema,
  attendanceRecordSchema,
  absenceJustificationSchema,
  gradeSchema,
  disciplinaryNoteSchema,
  homeworkAssignmentSchema,
  timetableSlotSchema,
  calendarEventSchema,
  meetingSlotSchema,
  meetingBookingSchema,
  announcementSchema,
  announcementReadReceiptSchema,
  termEvaluationSchema,
  auditLogEntrySchema,
} from '@openregistro/core';
import { createPostgresClient, type Database } from './client';
import {
  absenceJustificationsTable,
  announcementReadReceiptsTable,
  announcementsTable,
  appSettingsTable,
  attendanceRecordsTable,
  auditLogTable,
  calendarEventsTable,
  classesTable,
  disciplinaryNotesTable,
  enrollmentsTable,
  gradesTable,
  guardianshipsTable,
  homeworkAssignmentsTable,
  installerStateTable,
  lessonLogsTable,
  meetingBookingsTable,
  meetingSlotsTable,
  schoolYearsTable,
  schoolsTable,
  subjectsTable,
  teacherAssignmentsTable,
  termEvaluationsTable,
  termsTable,
  timetableSlotsTable,
  usersTable,
} from './schema';
import {
  createPgAppendOnlyRepository,
  createPgCreateDeleteRepository,
  createPgCreateOnlyRepository,
  createPgCrudRepository,
} from './repository-factory';

export interface PostgresDriverOptions {
  connectionString: string;
}

const INSTALLER_ROW_ID = 1;
const SETTINGS_ROW_ID = 1;

async function ensureInstallerRow(db: Database): Promise<void> {
  const existing = await db
    .select()
    .from(installerStateTable)
    .where(eq(installerStateTable.id, INSTALLER_ROW_ID))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(installerStateTable).values({
      id: INSTALLER_ROW_ID,
      completed: false,
      completedAt: null,
      storageDriver: null,
    });
  }
}

async function ensureAppSettingsRow(db: Database): Promise<void> {
  const existing = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, SETTINGS_ROW_ID))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(appSettingsTable).values({
      id: SETTINGS_ROW_ID,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
      smtpFrom: null,
      updatedAt: new Date().toISOString(),
    });
  }
}

const EMPTY_SETTINGS_ROW = {
  smtpHost: null,
  smtpPort: null,
  smtpUser: null,
  smtpPassword: null,
  smtpFrom: null,
  updatedAt: new Date(0).toISOString(),
};

function rowToAppSettings(row: {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  updatedAt: string;
}): AppSettings {
  return appSettingsSchema.parse({
    smtp:
      row.smtpHost && row.smtpPort && row.smtpFrom
        ? {
            host: row.smtpHost,
            port: row.smtpPort,
            user: row.smtpUser,
            password: row.smtpPassword,
            from: row.smtpFrom,
          }
        : null,
    updatedAt: row.updatedAt,
  });
}

export function createPostgresStorageDriver(options: PostgresDriverOptions): StorageDriver {
  let client: ReturnType<typeof createPostgresClient> | null = null;

  function requireDb(): Database {
    if (!client) throw new Error('Postgres driver used before connect() was called');
    return client.db;
  }

  return {
    kind: 'postgres',

    async connect() {
      client = createPostgresClient(options.connectionString);
      await ensureInstallerRow(client.db);
      await ensureAppSettingsRow(client.db);
    },

    async disconnect() {
      if (client) {
        await client.close();
        client = null;
      }
    },

    async healthCheck() {
      try {
        await requireDb().select().from(installerStateTable).limit(1);
        return true;
      } catch {
        return false;
      }
    },

    installer: {
      async get() {
        const db = requireDb();
        const [row] = await db
          .select()
          .from(installerStateTable)
          .where(eq(installerStateTable.id, INSTALLER_ROW_ID))
          .limit(1);
        return installerStateSchema.parse(row ?? DEFAULT_INSTALLER_STATE);
      },
      async complete(storageDriver) {
        const db = requireDb();
        const [row] = await db
          .update(installerStateTable)
          .set({
            completed: true,
            completedAt: new Date().toISOString(),
            storageDriver,
          })
          .where(eq(installerStateTable.id, INSTALLER_ROW_ID))
          .returning();
        return installerStateSchema.parse(row);
      },
    },

    settings: {
      async get() {
        const db = requireDb();
        const [row] = await db
          .select()
          .from(appSettingsTable)
          .where(eq(appSettingsTable.id, SETTINGS_ROW_ID))
          .limit(1);
        return rowToAppSettings(row ?? EMPTY_SETTINGS_ROW);
      },
      async update(input) {
        const db = requireDb();
        const now = new Date().toISOString();
        const [row] = await db
          .update(appSettingsTable)
          .set({
            smtpHost: input.smtp?.host ?? null,
            smtpPort: input.smtp?.port ?? null,
            smtpUser: input.smtp?.user ?? null,
            smtpPassword: input.smtp?.password ?? null,
            smtpFrom: input.smtp?.from ?? null,
            updatedAt: now,
          })
          .where(eq(appSettingsTable.id, SETTINGS_ROW_ID))
          .returning();
        return rowToAppSettings(row ?? EMPTY_SETTINGS_ROW);
      },
    },

    get users() {
      return createPgCrudRepository<User, UserRecordInput, UpdateUserInput>({
        db: requireDb(),
        table: usersTable,
        schema: userSchema,
        entityName: 'User',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get schools() {
      return createPgCrudRepository<School, CreateSchoolInput, UpdateSchoolInput>({
        db: requireDb(),
        table: schoolsTable,
        schema: schoolSchema,
        entityName: 'School',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get schoolYears() {
      return createPgCrudRepository<SchoolYear, CreateSchoolYearInput, UpdateSchoolYearInput>({
        db: requireDb(),
        table: schoolYearsTable,
        schema: schoolYearSchema,
        entityName: 'SchoolYear',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get terms() {
      return createPgCrudRepository<Term, CreateTermInput, UpdateTermInput>({
        db: requireDb(),
        table: termsTable,
        schema: termSchema,
        entityName: 'Term',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get classes() {
      return createPgCrudRepository<Class, CreateClassInput, UpdateClassInput>({
        db: requireDb(),
        table: classesTable,
        schema: classSchema,
        entityName: 'Class',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get subjects() {
      return createPgCrudRepository<Subject, CreateSubjectInput, UpdateSubjectInput>({
        db: requireDb(),
        table: subjectsTable,
        schema: subjectSchema,
        entityName: 'Subject',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get teacherAssignments() {
      return createPgCreateOnlyRepository<TeacherAssignment, CreateTeacherAssignmentInput>({
        db: requireDb(),
        table: teacherAssignmentsTable,
        schema: teacherAssignmentSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get enrollments() {
      return createPgCreateOnlyRepository<Enrollment, CreateEnrollmentInput>({
        db: requireDb(),
        table: enrollmentsTable,
        schema: enrollmentSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get guardianships() {
      return createPgCreateOnlyRepository<Guardianship, CreateGuardianshipInput>({
        db: requireDb(),
        table: guardianshipsTable,
        schema: guardianshipSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get lessonLogs() {
      return createPgCrudRepository<LessonLog, CreateLessonLogInput, UpdateLessonLogInput>({
        db: requireDb(),
        table: lessonLogsTable,
        schema: lessonLogSchema,
        entityName: 'LessonLog',
        mapCreate: (input, { id, now }) => ({
          ...input,
          id,
          signedAt: now,
          createdAt: now,
          updatedAt: now,
        }),
      });
    },

    get attendanceRecords() {
      return createPgCrudRepository<
        AttendanceRecord,
        CreateAttendanceRecordInput,
        UpdateAttendanceRecordInput
      >({
        db: requireDb(),
        table: attendanceRecordsTable,
        schema: attendanceRecordSchema,
        entityName: 'AttendanceRecord',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get absenceJustifications() {
      const db = requireDb();
      const base = createPgCreateOnlyRepository<
        AbsenceJustification,
        CreateAbsenceJustificationInput
      >({
        db,
        table: absenceJustificationsTable,
        schema: absenceJustificationSchema,
        mapCreate: (input, { id, now }) => ({
          ...input,
          id,
          status: 'pending' as const,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      });
      return {
        ...base,
        async review(
          id: AbsenceJustificationId,
          status: 'approved' | 'rejected',
          reviewedBy: string,
        ) {
          const now = new Date().toISOString();
          const [row] = await db
            .update(absenceJustificationsTable)
            .set({ status, reviewedBy, reviewedAt: now, updatedAt: now })
            .where(eq(absenceJustificationsTable.id, id))
            .returning();
          if (!row) throw new NotFoundError('AbsenceJustification', id);
          return absenceJustificationSchema.parse(row);
        },
      };
    },

    get grades() {
      return createPgCrudRepository<Grade, CreateGradeInput, UpdateGradeInput>({
        db: requireDb(),
        table: gradesTable,
        schema: gradeSchema,
        entityName: 'Grade',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get disciplinaryNotes() {
      return createPgCreateOnlyRepository<DisciplinaryNote, CreateDisciplinaryNoteInput>({
        db: requireDb(),
        table: disciplinaryNotesTable,
        schema: disciplinaryNoteSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get homeworkAssignments() {
      return createPgCrudRepository<
        HomeworkAssignment,
        CreateHomeworkAssignmentInput,
        UpdateHomeworkAssignmentInput
      >({
        db: requireDb(),
        table: homeworkAssignmentsTable,
        schema: homeworkAssignmentSchema,
        entityName: 'HomeworkAssignment',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get timetableSlots() {
      return createPgCreateDeleteRepository<TimetableSlot, CreateTimetableSlotInput>({
        db: requireDb(),
        table: timetableSlotsTable,
        schema: timetableSlotSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get calendarEvents() {
      return createPgCrudRepository<
        CalendarEvent,
        CreateCalendarEventInput,
        UpdateCalendarEventInput
      >({
        db: requireDb(),
        table: calendarEventsTable,
        schema: calendarEventSchema,
        entityName: 'CalendarEvent',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get meetingSlots() {
      return createPgCrudRepository<MeetingSlot, CreateMeetingSlotInput, UpdateMeetingSlotInput>({
        db: requireDb(),
        table: meetingSlotsTable,
        schema: meetingSlotSchema,
        entityName: 'MeetingSlot',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get meetingBookings() {
      return createPgCreateOnlyRepository<MeetingBooking, CreateMeetingBookingInput>({
        db: requireDb(),
        table: meetingBookingsTable,
        schema: meetingBookingSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get announcements() {
      return createPgCrudRepository<Announcement, CreateAnnouncementInput, UpdateAnnouncementInput>(
        {
          db: requireDb(),
          table: announcementsTable,
          schema: announcementSchema,
          entityName: 'Announcement',
          mapCreate: (input, { id, now }) => ({
            ...input,
            id,
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
          }),
        },
      );
    },

    get announcementReadReceipts() {
      return createPgAppendOnlyRepository<
        AnnouncementReadReceipt,
        CreateAnnouncementReadReceiptInput
      >({
        db: requireDb(),
        table: announcementReadReceiptsTable,
        schema: announcementReadReceiptSchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, readAt: now }),
      });
    },

    get termEvaluations() {
      return createPgCrudRepository<
        TermEvaluation,
        CreateTermEvaluationInput,
        UpdateTermEvaluationInput
      >({
        db: requireDb(),
        table: termEvaluationsTable,
        schema: termEvaluationSchema,
        entityName: 'TermEvaluation',
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
      });
    },

    get auditLog() {
      return createPgAppendOnlyRepository<AuditLogEntry, CreateAuditLogEntryInput>({
        db: requireDb(),
        table: auditLogTable,
        schema: auditLogEntrySchema,
        mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now }),
      });
    },
  };
}
