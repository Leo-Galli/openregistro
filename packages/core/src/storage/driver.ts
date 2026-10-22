import type { User, UserId, UserRecordInput, UpdateUserInput } from '../domain/user';
import type {
  School,
  SchoolId,
  CreateSchoolInput,
  UpdateSchoolInput,
  SchoolYear,
  SchoolYearId,
  CreateSchoolYearInput,
  UpdateSchoolYearInput,
  Term,
  TermId,
  CreateTermInput,
  UpdateTermInput,
} from '../domain/school';
import type {
  Class,
  ClassId,
  CreateClassInput,
  UpdateClassInput,
  Subject,
  SubjectId,
  CreateSubjectInput,
  UpdateSubjectInput,
  TeacherAssignment,
  TeacherAssignmentId,
  CreateTeacherAssignmentInput,
  Enrollment,
  EnrollmentId,
  CreateEnrollmentInput,
  Guardianship,
  GuardianshipId,
  CreateGuardianshipInput,
} from '../domain/academic-structure';
import type {
  LessonLog,
  LessonLogId,
  CreateLessonLogInput,
  UpdateLessonLogInput,
  AttendanceRecord,
  AttendanceRecordId,
  CreateAttendanceRecordInput,
  UpdateAttendanceRecordInput,
  AbsenceJustification,
  AbsenceJustificationId,
  CreateAbsenceJustificationInput,
} from '../domain/register';
import type {
  Grade,
  GradeId,
  CreateGradeInput,
  UpdateGradeInput,
  DisciplinaryNote,
  DisciplinaryNoteId,
  CreateDisciplinaryNoteInput,
  HomeworkAssignment,
  HomeworkAssignmentId,
  CreateHomeworkAssignmentInput,
  UpdateHomeworkAssignmentInput,
} from '../domain/grades';
import type {
  TimetableSlot,
  TimetableSlotId,
  CreateTimetableSlotInput,
  CalendarEvent,
  CalendarEventId,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  MeetingSlot,
  MeetingSlotId,
  CreateMeetingSlotInput,
  UpdateMeetingSlotInput,
  MeetingBooking,
  MeetingBookingId,
  CreateMeetingBookingInput,
} from '../domain/calendar';
import type {
  Announcement,
  AnnouncementId,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementReadReceipt,
  AnnouncementReadReceiptId,
  CreateAnnouncementReadReceiptInput,
} from '../domain/announcements';
import type {
  TermEvaluation,
  TermEvaluationId,
  CreateTermEvaluationInput,
  UpdateTermEvaluationInput,
} from '../domain/report-card';
import type { AuditLogEntry, CreateAuditLogEntryInput } from '../domain/audit';
import type { InstallerState } from '../domain/installer';

export interface ReadRepository<T, Id> {
  findById(id: Id): Promise<T | null>;
  findMany(filter?: Partial<T>): Promise<T[]>;
}

export interface CrudRepository<T, Id, CreateInput, UpdateInput> extends ReadRepository<T, Id> {
  create(input: CreateInput): Promise<T>;
  update(id: Id, input: UpdateInput): Promise<T>;
  delete(id: Id): Promise<void>;
}

export interface CreateOnlyRepository<T, Id, CreateInput> extends ReadRepository<T, Id> {
  create(input: CreateInput): Promise<T>;
}

/** For entities that are recreated rather than edited in place (e.g. a timetable slot). */
export interface CreateDeleteRepository<T, Id, CreateInput> extends ReadRepository<T, Id> {
  create(input: CreateInput): Promise<T>;
  delete(id: Id): Promise<void>;
}

export interface AppendOnlyRepository<T, Id, CreateInput> {
  findById(id: Id): Promise<T | null>;
  findMany(filter?: Partial<Omit<T, 'before' | 'after'>>): Promise<T[]>;
  create(input: CreateInput): Promise<T>;
}

export interface InstallerStateRepository {
  get(): Promise<InstallerState>;
  complete(storageDriver: 'json' | 'postgres'): Promise<InstallerState>;
}

/**
 * The single contract both the `json` and `postgres` drivers implement.
 * Every method must behave identically for the shared Vitest contract suite
 * in packages/db to pass against both.
 */
export interface StorageDriver {
  readonly kind: 'json' | 'postgres';

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  installer: InstallerStateRepository;
  users: CrudRepository<User, UserId, UserRecordInput, UpdateUserInput>;
  schools: CrudRepository<School, SchoolId, CreateSchoolInput, UpdateSchoolInput>;
  schoolYears: CrudRepository<
    SchoolYear,
    SchoolYearId,
    CreateSchoolYearInput,
    UpdateSchoolYearInput
  >;
  terms: CrudRepository<Term, TermId, CreateTermInput, UpdateTermInput>;
  classes: CrudRepository<Class, ClassId, CreateClassInput, UpdateClassInput>;
  subjects: CrudRepository<Subject, SubjectId, CreateSubjectInput, UpdateSubjectInput>;
  teacherAssignments: CreateOnlyRepository<
    TeacherAssignment,
    TeacherAssignmentId,
    CreateTeacherAssignmentInput
  >;
  enrollments: CreateOnlyRepository<Enrollment, EnrollmentId, CreateEnrollmentInput>;
  guardianships: CreateOnlyRepository<Guardianship, GuardianshipId, CreateGuardianshipInput>;
  lessonLogs: CrudRepository<LessonLog, LessonLogId, CreateLessonLogInput, UpdateLessonLogInput>;
  attendanceRecords: CrudRepository<
    AttendanceRecord,
    AttendanceRecordId,
    CreateAttendanceRecordInput,
    UpdateAttendanceRecordInput
  >;
  absenceJustifications: CreateOnlyRepository<
    AbsenceJustification,
    AbsenceJustificationId,
    CreateAbsenceJustificationInput
  > & {
    review(
      id: AbsenceJustificationId,
      status: 'approved' | 'rejected',
      reviewedBy: string,
    ): Promise<AbsenceJustification>;
  };
  grades: CrudRepository<Grade, GradeId, CreateGradeInput, UpdateGradeInput>;
  disciplinaryNotes: CreateOnlyRepository<
    DisciplinaryNote,
    DisciplinaryNoteId,
    CreateDisciplinaryNoteInput
  >;
  homeworkAssignments: CrudRepository<
    HomeworkAssignment,
    HomeworkAssignmentId,
    CreateHomeworkAssignmentInput,
    UpdateHomeworkAssignmentInput
  >;
  timetableSlots: CreateDeleteRepository<TimetableSlot, TimetableSlotId, CreateTimetableSlotInput>;
  calendarEvents: CrudRepository<
    CalendarEvent,
    CalendarEventId,
    CreateCalendarEventInput,
    UpdateCalendarEventInput
  >;
  meetingSlots: CrudRepository<
    MeetingSlot,
    MeetingSlotId,
    CreateMeetingSlotInput,
    UpdateMeetingSlotInput
  >;
  meetingBookings: CreateOnlyRepository<
    MeetingBooking,
    MeetingBookingId,
    CreateMeetingBookingInput
  >;
  announcements: CrudRepository<
    Announcement,
    AnnouncementId,
    CreateAnnouncementInput,
    UpdateAnnouncementInput
  >;
  announcementReadReceipts: CreateOnlyRepository<
    AnnouncementReadReceipt,
    AnnouncementReadReceiptId,
    CreateAnnouncementReadReceiptInput
  >;
  termEvaluations: CrudRepository<
    TermEvaluation,
    TermEvaluationId,
    CreateTermEvaluationInput,
    UpdateTermEvaluationInput
  >;
  auditLog: AppendOnlyRepository<AuditLogEntry, string, CreateAuditLogEntryInput>;
}
