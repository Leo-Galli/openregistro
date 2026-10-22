import { promises as fs } from 'node:fs';
import path from 'node:path';
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
  type InstallerState,
  type AppSettings,
  NotFoundError,
  DEFAULT_INSTALLER_STATE,
  DEFAULT_APP_SETTINGS,
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
import { JsonFileStore } from './file-store';
import { JsonCollection } from './json-collection';
import {
  createJsonAppendOnlyRepository,
  createJsonCreateDeleteRepository,
  createJsonCreateOnlyRepository,
  createJsonCrudRepository,
} from './repository-factory';
import { withFileLock } from './file-lock';

export interface JsonDriverOptions {
  dataDir: string;
}

export function createJsonStorageDriver(options: JsonDriverOptions): StorageDriver {
  const { dataDir } = options;
  const installerFilePath = path.join(dataDir, 'installer-state.json');
  const installerStore = new JsonFileStore<InstallerState>(installerFilePath, DEFAULT_INSTALLER_STATE);
  const installerLockPath = `${installerFilePath}.lock`;

  const settingsFilePath = path.join(dataDir, 'app-settings.json');
  const settingsStore = new JsonFileStore<AppSettings>(settingsFilePath, DEFAULT_APP_SETTINGS);
  const settingsLockPath = `${settingsFilePath}.lock`;

  const collections = {
    users: new JsonCollection<User>(dataDir, 'users'),
    schools: new JsonCollection<School>(dataDir, 'schools'),
    schoolYears: new JsonCollection<SchoolYear>(dataDir, 'school-years'),
    terms: new JsonCollection<Term>(dataDir, 'terms'),
    classes: new JsonCollection<Class>(dataDir, 'classes'),
    subjects: new JsonCollection<Subject>(dataDir, 'subjects'),
    teacherAssignments: new JsonCollection<TeacherAssignment>(dataDir, 'teacher-assignments'),
    enrollments: new JsonCollection<Enrollment>(dataDir, 'enrollments'),
    guardianships: new JsonCollection<Guardianship>(dataDir, 'guardianships'),
    lessonLogs: new JsonCollection<LessonLog>(dataDir, 'lesson-logs'),
    attendanceRecords: new JsonCollection<AttendanceRecord>(dataDir, 'attendance-records'),
    absenceJustifications: new JsonCollection<AbsenceJustification>(dataDir, 'absence-justifications'),
    grades: new JsonCollection<Grade>(dataDir, 'grades'),
    disciplinaryNotes: new JsonCollection<DisciplinaryNote>(dataDir, 'disciplinary-notes'),
    homeworkAssignments: new JsonCollection<HomeworkAssignment>(dataDir, 'homework-assignments'),
    timetableSlots: new JsonCollection<TimetableSlot>(dataDir, 'timetable-slots'),
    calendarEvents: new JsonCollection<CalendarEvent>(dataDir, 'calendar-events'),
    meetingSlots: new JsonCollection<MeetingSlot>(dataDir, 'meeting-slots'),
    meetingBookings: new JsonCollection<MeetingBooking>(dataDir, 'meeting-bookings'),
    announcements: new JsonCollection<Announcement>(dataDir, 'announcements'),
    announcementReadReceipts: new JsonCollection<AnnouncementReadReceipt>(
      dataDir,
      'announcement-read-receipts',
    ),
    termEvaluations: new JsonCollection<TermEvaluation>(dataDir, 'term-evaluations'),
    auditLog: new JsonCollection<AuditLogEntry>(dataDir, 'audit-log'),
  };

  return {
    kind: 'json',

    async connect() {
      await fs.mkdir(dataDir, { recursive: true });
    },

    async disconnect() {
      // No persistent connection to close for the filesystem driver.
    },

    async healthCheck() {
      try {
        await fs.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    },

    installer: {
      async get() {
        return installerStateSchema.parse(await installerStore.read());
      },
      async complete(storageDriver) {
        return withFileLock(installerLockPath, async () => {
          const next = installerStateSchema.parse({
            completed: true,
            completedAt: new Date().toISOString(),
            storageDriver,
          });
          await installerStore.write(next);
          return next;
        });
      },
    },

    settings: {
      async get() {
        return appSettingsSchema.parse(await settingsStore.read());
      },
      async update(input) {
        return withFileLock(settingsLockPath, async () => {
          const next = appSettingsSchema.parse({
            smtp: input.smtp,
            updatedAt: new Date().toISOString(),
          });
          await settingsStore.write(next);
          return next;
        });
      },
    },

    users: createJsonCrudRepository<User, UserRecordInput, UpdateUserInput>({
      collection: collections.users,
      schema: userSchema,
      mapCreate: (input, { id, now }) => ({
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
      }),
    }),

    schools: createJsonCrudRepository<School, CreateSchoolInput, UpdateSchoolInput>({
      collection: collections.schools,
      schema: schoolSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    schoolYears: createJsonCrudRepository<SchoolYear, CreateSchoolYearInput, UpdateSchoolYearInput>({
      collection: collections.schoolYears,
      schema: schoolYearSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    terms: createJsonCrudRepository<Term, CreateTermInput, UpdateTermInput>({
      collection: collections.terms,
      schema: termSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    classes: createJsonCrudRepository<Class, CreateClassInput, UpdateClassInput>({
      collection: collections.classes,
      schema: classSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    subjects: createJsonCrudRepository<Subject, CreateSubjectInput, UpdateSubjectInput>({
      collection: collections.subjects,
      schema: subjectSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    teacherAssignments: createJsonCreateOnlyRepository<TeacherAssignment, CreateTeacherAssignmentInput>({
      collection: collections.teacherAssignments,
      schema: teacherAssignmentSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    enrollments: createJsonCreateOnlyRepository<Enrollment, CreateEnrollmentInput>({
      collection: collections.enrollments,
      schema: enrollmentSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    guardianships: createJsonCreateOnlyRepository<Guardianship, CreateGuardianshipInput>({
      collection: collections.guardianships,
      schema: guardianshipSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    lessonLogs: createJsonCrudRepository<LessonLog, CreateLessonLogInput, UpdateLessonLogInput>({
      collection: collections.lessonLogs,
      schema: lessonLogSchema,
      mapCreate: (input, { id, now }) => ({
        ...input,
        id,
        signedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    }),

    attendanceRecords: createJsonCrudRepository<
      AttendanceRecord,
      CreateAttendanceRecordInput,
      UpdateAttendanceRecordInput
    >({
      collection: collections.attendanceRecords,
      schema: attendanceRecordSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    absenceJustifications: {
      ...createJsonCreateOnlyRepository<AbsenceJustification, CreateAbsenceJustificationInput>({
        collection: collections.absenceJustifications,
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
      }),
      async review(id: AbsenceJustificationId, status: 'approved' | 'rejected', reviewedBy: string) {
        const existing = await collections.absenceJustifications.findById(id);
        if (!existing) throw new NotFoundError('absenceJustifications', id);
        const now = new Date().toISOString();
        const updated = absenceJustificationSchema.parse({
          ...existing,
          status,
          reviewedBy,
          reviewedAt: now,
          updatedAt: now,
        });
        return collections.absenceJustifications.replace(id, updated);
      },
    },

    grades: createJsonCrudRepository<Grade, CreateGradeInput, UpdateGradeInput>({
      collection: collections.grades,
      schema: gradeSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    disciplinaryNotes: createJsonCreateOnlyRepository<DisciplinaryNote, CreateDisciplinaryNoteInput>({
      collection: collections.disciplinaryNotes,
      schema: disciplinaryNoteSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    homeworkAssignments: createJsonCrudRepository<
      HomeworkAssignment,
      CreateHomeworkAssignmentInput,
      UpdateHomeworkAssignmentInput
    >({
      collection: collections.homeworkAssignments,
      schema: homeworkAssignmentSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    timetableSlots: createJsonCreateDeleteRepository<TimetableSlot, CreateTimetableSlotInput>({
      collection: collections.timetableSlots,
      schema: timetableSlotSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    calendarEvents: createJsonCrudRepository<
      CalendarEvent,
      CreateCalendarEventInput,
      UpdateCalendarEventInput
    >({
      collection: collections.calendarEvents,
      schema: calendarEventSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    meetingSlots: createJsonCrudRepository<MeetingSlot, CreateMeetingSlotInput, UpdateMeetingSlotInput>({
      collection: collections.meetingSlots,
      schema: meetingSlotSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    meetingBookings: createJsonCreateOnlyRepository<MeetingBooking, CreateMeetingBookingInput>({
      collection: collections.meetingBookings,
      schema: meetingBookingSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    announcements: createJsonCrudRepository<
      Announcement,
      CreateAnnouncementInput,
      UpdateAnnouncementInput
    >({
      collection: collections.announcements,
      schema: announcementSchema,
      mapCreate: (input, { id, now }) => ({
        ...input,
        id,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    }),

    announcementReadReceipts: createJsonAppendOnlyRepository<
      AnnouncementReadReceipt,
      CreateAnnouncementReadReceiptInput
    >({
      collection: collections.announcementReadReceipts,
      schema: announcementReadReceiptSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, readAt: now }),
    }),

    termEvaluations: createJsonCrudRepository<
      TermEvaluation,
      CreateTermEvaluationInput,
      UpdateTermEvaluationInput
    >({
      collection: collections.termEvaluations,
      schema: termEvaluationSchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
    }),

    auditLog: createJsonAppendOnlyRepository<AuditLogEntry, CreateAuditLogEntryInput>({
      collection: collections.auditLog,
      schema: auditLogEntrySchema,
      mapCreate: (input, { id, now }) => ({ ...input, id, createdAt: now }),
    }),
  };
}
