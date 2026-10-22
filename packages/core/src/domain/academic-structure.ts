import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { schoolIdSchema, schoolYearIdSchema } from './school';

export const classIdSchema = brandedId('ClassId');
export type ClassId = z.infer<typeof classIdSchema>;

export const classSchema = z.object({
  id: classIdSchema,
  schoolId: schoolIdSchema,
  schoolYearId: schoolYearIdSchema,
  name: z.string().min(1).max(50),
  gradeLevel: z.number().int().min(1).max(13),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Class = z.infer<typeof classSchema>;

export const createClassInputSchema = classSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const updateClassInputSchema = createClassInputSchema.partial();
export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

export const subjectIdSchema = brandedId('SubjectId');
export type SubjectId = z.infer<typeof subjectIdSchema>;

export const subjectSchema = z.object({
  id: subjectIdSchema,
  schoolId: schoolIdSchema,
  name: z.string().min(1).max(100),
  shortCode: z.string().min(1).max(10),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Subject = z.infer<typeof subjectSchema>;

export const createSubjectInputSchema = subjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

export const updateSubjectInputSchema = createSubjectInputSchema.partial();
export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

export const teacherAssignmentIdSchema = brandedId('TeacherAssignmentId');
export type TeacherAssignmentId = z.infer<typeof teacherAssignmentIdSchema>;

/** Links a teacher (userId of role 'teacher') to the class/subject pair they teach. */
export const teacherAssignmentSchema = z.object({
  id: teacherAssignmentIdSchema,
  teacherId: brandedId('UserId'),
  classId: classIdSchema,
  subjectId: subjectIdSchema,
  weeklyHours: z.number().min(0).max(40),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type TeacherAssignment = z.infer<typeof teacherAssignmentSchema>;

export const createTeacherAssignmentInputSchema = teacherAssignmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTeacherAssignmentInput = z.infer<typeof createTeacherAssignmentInputSchema>;

export const enrollmentIdSchema = brandedId('EnrollmentId');
export type EnrollmentId = z.infer<typeof enrollmentIdSchema>;

/** Links a student (userId of role 'student') to the class they attend for a school year. */
export const enrollmentSchema = z.object({
  id: enrollmentIdSchema,
  studentId: brandedId('UserId'),
  classId: classIdSchema,
  schoolYearId: schoolYearIdSchema,
  enrolledAt: z.string().date(),
  withdrawnAt: z.string().date().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Enrollment = z.infer<typeof enrollmentSchema>;

export const createEnrollmentInputSchema = enrollmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentInputSchema>;

export const guardianshipIdSchema = brandedId('GuardianshipId');
export type GuardianshipId = z.infer<typeof guardianshipIdSchema>;

/** Links a guardian (userId of role 'guardian') to the student(s) they are responsible for. */
export const guardianshipSchema = z.object({
  id: guardianshipIdSchema,
  guardianId: brandedId('UserId'),
  studentId: brandedId('UserId'),
  relationship: z.string().min(1).max(50),
  isPrimaryContact: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Guardianship = z.infer<typeof guardianshipSchema>;

export const createGuardianshipInputSchema = guardianshipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateGuardianshipInput = z.infer<typeof createGuardianshipInputSchema>;
