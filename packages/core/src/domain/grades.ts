import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { classIdSchema, subjectIdSchema } from './academic-structure';
import { termIdSchema } from './school';

export const gradeTypeSchema = z.enum(['written', 'oral', 'practical']);
export type GradeType = z.infer<typeof gradeTypeSchema>;

export const gradeIdSchema = brandedId('GradeId');
export type GradeId = z.infer<typeof gradeIdSchema>;

export const gradeSchema = z.object({
  id: gradeIdSchema,
  studentId: brandedId('UserId'),
  classId: classIdSchema,
  subjectId: subjectIdSchema,
  termId: termIdSchema,
  teacherId: brandedId('UserId'),
  type: gradeTypeSchema,
  value: z.number().min(0).max(10),
  weight: z.number().min(0.1).max(5),
  date: z.string().date(),
  note: z.string().max(500).nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Grade = z.infer<typeof gradeSchema>;

export const createGradeInputSchema = gradeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateGradeInput = z.infer<typeof createGradeInputSchema>;

export const updateGradeInputSchema = createGradeInputSchema
  .pick({ value: true, weight: true, note: true, date: true })
  .partial();
export type UpdateGradeInput = z.infer<typeof updateGradeInputSchema>;

export function weightedAverage(grades: readonly Pick<Grade, 'value' | 'weight'>[]): number | null {
  if (grades.length === 0) return null;
  const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);
  if (totalWeight === 0) return null;
  const weightedSum = grades.reduce((sum, grade) => sum + grade.value * grade.weight, 0);
  return weightedSum / totalWeight;
}

export const disciplinaryNoteIdSchema = brandedId('DisciplinaryNoteId');
export type DisciplinaryNoteId = z.infer<typeof disciplinaryNoteIdSchema>;

export const disciplinaryNoteSchema = z.object({
  id: disciplinaryNoteIdSchema,
  studentId: brandedId('UserId'),
  classId: classIdSchema,
  authorId: brandedId('UserId'),
  date: z.string().date(),
  description: z.string().min(1).max(2000),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type DisciplinaryNote = z.infer<typeof disciplinaryNoteSchema>;

export const createDisciplinaryNoteInputSchema = disciplinaryNoteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateDisciplinaryNoteInput = z.infer<typeof createDisciplinaryNoteInputSchema>;

export const homeworkAssignmentIdSchema = brandedId('HomeworkAssignmentId');
export type HomeworkAssignmentId = z.infer<typeof homeworkAssignmentIdSchema>;

export const homeworkAssignmentSchema = z.object({
  id: homeworkAssignmentIdSchema,
  classId: classIdSchema,
  subjectId: subjectIdSchema,
  teacherId: brandedId('UserId'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  assignedDate: z.string().date(),
  dueDate: z.string().date(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type HomeworkAssignment = z.infer<typeof homeworkAssignmentSchema>;

export const createHomeworkAssignmentInputSchema = homeworkAssignmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateHomeworkAssignmentInput = z.infer<typeof createHomeworkAssignmentInputSchema>;

export const updateHomeworkAssignmentInputSchema = createHomeworkAssignmentInputSchema.partial();
export type UpdateHomeworkAssignmentInput = z.infer<typeof updateHomeworkAssignmentInputSchema>;
