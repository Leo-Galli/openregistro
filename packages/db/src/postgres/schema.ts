import {
  boolean,
  date,
  integer,
  jsonb,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'school_admin',
  'secretary',
  'principal',
  'teacher',
  'student',
  'guardian',
]);

export const termKindEnum = pgEnum('term_kind', ['trimester', 'semester']);
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
  'early_leave',
]);
export const justificationStatusEnum = pgEnum('justification_status', [
  'pending',
  'approved',
  'rejected',
]);
export const gradeTypeEnum = pgEnum('grade_type', ['written', 'oral', 'practical']);
export const calendarEventTypeEnum = pgEnum('calendar_event_type', ['test', 'event', 'holiday']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete']);
export const auditEntityEnum = pgEnum('audit_entity', [
  'grade',
  'attendance_record',
  'absence_justification',
  'disciplinary_note',
  'term_evaluation',
  'user',
]);
export const storageDriverEnum = pgEnum('installer_storage_driver', ['json', 'postgres']);
export const provisioningStatusEnum = pgEnum('provisioning_status', [
  'not_started',
  'provisioning',
  'ready',
  'failed',
]);

export const hostingRequestStatusEnum = pgEnum('hosting_request_status', [
  'pending',
  'contacted',
  'activated',
  'declined',
]);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
};

export const installerStateTable = pgTable('installer_state', {
  id: integer('id').primaryKey().default(1),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  storageDriver: storageDriverEnum('storage_driver'),
});

export const appSettingsTable = pgTable('app_settings', {
  id: integer('id').primaryKey().default(1),
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpUser: text('smtp_user'),
  smtpPassword: text('smtp_password'),
  smtpFrom: text('smtp_from'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
});

export const schoolsTable = pgTable('schools', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  contactEmail: text('contact_email'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  themeId: text('theme_id'),
  usePlatformEmail: boolean('use_platform_email').notNull().default(false),
  ...timestamps,
});

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schoolsTable.id),
  role: roleEnum('role').notNull(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  totpSecret: text('totp_secret'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' }),
  ...timestamps,
});

export const schoolYearsTable = pgTable('school_years', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schoolsTable.id),
  label: text('label').notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
  isActive: boolean('is_active').notNull().default(false),
  ...timestamps,
});

export const termsTable = pgTable('terms', {
  id: uuid('id').primaryKey(),
  schoolYearId: uuid('school_year_id')
    .notNull()
    .references(() => schoolYearsTable.id),
  kind: termKindEnum('kind').notNull(),
  label: text('label').notNull(),
  sequence: integer('sequence').notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
  ...timestamps,
});

export const classesTable = pgTable('classes', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schoolsTable.id),
  schoolYearId: uuid('school_year_id')
    .notNull()
    .references(() => schoolYearsTable.id),
  name: text('name').notNull(),
  gradeLevel: integer('grade_level').notNull(),
  ...timestamps,
});

export const subjectsTable = pgTable('subjects', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schoolsTable.id),
  name: text('name').notNull(),
  shortCode: text('short_code').notNull(),
  ...timestamps,
});

export const teacherAssignmentsTable = pgTable('teacher_assignments', {
  id: uuid('id').primaryKey(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  weeklyHours: doublePrecision('weekly_hours').notNull(),
  ...timestamps,
});

export const enrollmentsTable = pgTable('enrollments', {
  id: uuid('id').primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  schoolYearId: uuid('school_year_id')
    .notNull()
    .references(() => schoolYearsTable.id),
  enrolledAt: date('enrolled_at', { mode: 'string' }).notNull(),
  withdrawnAt: date('withdrawn_at', { mode: 'string' }),
  ...timestamps,
});

export const guardianshipsTable = pgTable('guardianships', {
  id: uuid('id').primaryKey(),
  guardianId: uuid('guardian_id')
    .notNull()
    .references(() => usersTable.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  relationship: text('relationship').notNull(),
  isPrimaryContact: boolean('is_primary_contact').notNull().default(false),
  ...timestamps,
});

export const lessonLogsTable = pgTable('lesson_logs', {
  id: uuid('id').primaryKey(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  date: date('date', { mode: 'string' }).notNull(),
  hourSlot: integer('hour_slot').notNull(),
  topic: text('topic').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true, mode: 'string' }).notNull(),
  ...timestamps,
});

export const attendanceRecordsTable = pgTable('attendance_records', {
  id: uuid('id').primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  date: date('date', { mode: 'string' }).notNull(),
  status: attendanceStatusEnum('status').notNull(),
  minutesLate: integer('minutes_late'),
  recordedBy: uuid('recorded_by')
    .notNull()
    .references(() => usersTable.id),
  ...timestamps,
});

export const absenceJustificationsTable = pgTable('absence_justifications', {
  id: uuid('id').primaryKey(),
  attendanceRecordId: uuid('attendance_record_id')
    .notNull()
    .references(() => attendanceRecordsTable.id),
  submittedBy: uuid('submitted_by')
    .notNull()
    .references(() => usersTable.id),
  reason: text('reason').notNull(),
  status: justificationStatusEnum('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => usersTable.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  ...timestamps,
});

export const gradesTable = pgTable('grades', {
  id: uuid('id').primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  termId: uuid('term_id')
    .notNull()
    .references(() => termsTable.id),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  type: gradeTypeEnum('type').notNull(),
  value: doublePrecision('value').notNull(),
  weight: doublePrecision('weight').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  note: text('note'),
  ...timestamps,
});

export const disciplinaryNotesTable = pgTable('disciplinary_notes', {
  id: uuid('id').primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id),
  date: date('date', { mode: 'string' }).notNull(),
  description: text('description').notNull(),
  ...timestamps,
});

export const homeworkAssignmentsTable = pgTable('homework_assignments', {
  id: uuid('id').primaryKey(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  assignedDate: date('assigned_date', { mode: 'string' }).notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  ...timestamps,
});

export const timetableSlotsTable = pgTable('timetable_slots', {
  id: uuid('id').primaryKey(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classesTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  weekday: integer('weekday').notNull(),
  hourSlot: integer('hour_slot').notNull(),
  ...timestamps,
});

export const calendarEventsTable = pgTable('calendar_events', {
  id: uuid('id').primaryKey(),
  classId: uuid('class_id').references(() => classesTable.id),
  subjectId: uuid('subject_id').references(() => subjectsTable.id),
  type: calendarEventTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: date('date', { mode: 'string' }).notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => usersTable.id),
  ...timestamps,
});

export const meetingSlotsTable = pgTable('meeting_slots', {
  id: uuid('id').primaryKey(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => usersTable.id),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }).notNull(),
  location: text('location'),
  capacity: integer('capacity').notNull(),
  ...timestamps,
});

export const meetingBookingsTable = pgTable('meeting_bookings', {
  id: uuid('id').primaryKey(),
  meetingSlotId: uuid('meeting_slot_id')
    .notNull()
    .references(() => meetingSlotsTable.id),
  guardianId: uuid('guardian_id')
    .notNull()
    .references(() => usersTable.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  notes: text('notes'),
  ...timestamps,
});

export const announcementsTable = pgTable('announcements', {
  id: uuid('id').primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schoolsTable.id),
  classId: uuid('class_id').references(() => classesTable.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => usersTable.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  attachments: jsonb('attachments').notNull().default([]),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }).notNull(),
  ...timestamps,
});

export const announcementReadReceiptsTable = pgTable('announcement_read_receipts', {
  id: uuid('id').primaryKey(),
  announcementId: uuid('announcement_id')
    .notNull()
    .references(() => announcementsTable.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }).notNull(),
});

export const termEvaluationsTable = pgTable('term_evaluations', {
  id: uuid('id').primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => usersTable.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjectsTable.id),
  termId: uuid('term_id')
    .notNull()
    .references(() => termsTable.id),
  finalGrade: doublePrecision('final_grade').notNull(),
  comment: text('comment'),
  decidedBy: uuid('decided_by')
    .notNull()
    .references(() => usersTable.id),
  ...timestamps,
});

export const auditLogTable = pgTable('audit_log', {
  id: uuid('id').primaryKey(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => usersTable.id),
  action: auditActionEnum('action').notNull(),
  entityKind: auditEntityEnum('entity_kind').notNull(),
  entityId: uuid('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
});

/**
 * Pre-sales leads from schools asking for a managed/hosted instance via the
 * marketing site's "Request hosting" page - deliberately NOT a row on
 * schoolsTable (that table is for schools that already have an installed
 * instance). Reviewed and activated manually by the operator; see
 * apps/web/app/internal/hosting-requests for the hidden admin view.
 */
export const hostingRequestsTable = pgTable('hosting_requests', {
  id: uuid('id').primaryKey(),
  schoolName: text('school_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  approxStudents: integer('approx_students'),
  message: text('message'),
  status: hostingRequestStatusEnum('status').notNull().default('pending'),
  licenseKey: text('license_key'),
  /**
   * Assigned when the operator activates the request (see
   * apps/web/lib/subdomain-slug.ts) - the school's eventual
   * <subdomain>.openregistro.another-horizon.eu address. Nullable because it
   * does not exist yet for pending/contacted/declined requests.
   */
  subdomain: text('subdomain').unique(),
  /**
   * The Vercel project name for this school's dedicated instance - a
   * deterministic `openregistro-<subdomain>` string, not a raw Vercel
   * project ID, since Vercel's own APIs/CLI accept a project name
   * interchangeably with its ID everywhere this codebase calls them.
   */
  vercelProjectId: text('vercel_project_id'),
  provisioningStatus: provisioningStatusEnum('provisioning_status')
    .notNull()
    .default('not_started'),
  provisioningError: text('provisioning_error'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
});
