import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { classIdSchema, subjectIdSchema } from './academic-structure';

export const lessonLogIdSchema = brandedId('LessonLogId');
export type LessonLogId = z.infer<typeof lessonLogIdSchema>;

/** One teacher's signed entry for a class/subject on a given date and hour slot. */
export const lessonLogSchema = z.object({
  id: lessonLogIdSchema,
  classId: classIdSchema,
  subjectId: subjectIdSchema,
  teacherId: brandedId('UserId'),
  date: z.string().date(),
  hourSlot: z.number().int().min(1).max(12),
  topic: z.string().max(2000),
  signedAt: timestampSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type LessonLog = z.infer<typeof lessonLogSchema>;

export const createLessonLogInputSchema = lessonLogSchema.omit({
  id: true,
  signedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateLessonLogInput = z.infer<typeof createLessonLogInputSchema>;

export const updateLessonLogInputSchema = createLessonLogInputSchema
  .pick({ topic: true })
  .partial();
export type UpdateLessonLogInput = z.infer<typeof updateLessonLogInputSchema>;

export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'early_leave']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const attendanceRecordIdSchema = brandedId('AttendanceRecordId');
export type AttendanceRecordId = z.infer<typeof attendanceRecordIdSchema>;

export const attendanceRecordSchema = z.object({
  id: attendanceRecordIdSchema,
  studentId: brandedId('UserId'),
  classId: classIdSchema,
  date: z.string().date(),
  status: attendanceStatusSchema,
  minutesLate: z.number().int().min(0).max(600).nullable(),
  recordedBy: brandedId('UserId'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const createAttendanceRecordInputSchema = attendanceRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordInputSchema>;

export const updateAttendanceRecordInputSchema = createAttendanceRecordInputSchema
  .pick({ status: true, minutesLate: true })
  .partial();
export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordInputSchema>;

export const justificationStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type JustificationStatus = z.infer<typeof justificationStatusSchema>;

export const absenceJustificationIdSchema = brandedId('AbsenceJustificationId');
export type AbsenceJustificationId = z.infer<typeof absenceJustificationIdSchema>;

/** A guardian's (or adult student's) online justification for an absence record. */
export const absenceJustificationSchema = z.object({
  id: absenceJustificationIdSchema,
  attendanceRecordId: attendanceRecordIdSchema,
  submittedBy: brandedId('UserId'),
  reason: z.string().min(1).max(1000),
  status: justificationStatusSchema,
  reviewedBy: brandedId('UserId').nullable(),
  reviewedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type AbsenceJustification = z.infer<typeof absenceJustificationSchema>;

export const createAbsenceJustificationInputSchema = absenceJustificationSchema.omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAbsenceJustificationInput = z.infer<typeof createAbsenceJustificationInputSchema>;

export const reviewAbsenceJustificationInputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewedBy: brandedId('UserId'),
});
export type ReviewAbsenceJustificationInput = z.infer<typeof reviewAbsenceJustificationInputSchema>;
