import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { subjectIdSchema } from './academic-structure';
import { termIdSchema } from './school';

export const termEvaluationIdSchema = brandedId('TermEvaluationId');
export type TermEvaluationId = z.infer<typeof termEvaluationIdSchema>;

/** The final per-subject, per-term grade that goes on the printed report card. */
export const termEvaluationSchema = z.object({
  id: termEvaluationIdSchema,
  studentId: brandedId('UserId'),
  subjectId: subjectIdSchema,
  termId: termIdSchema,
  finalGrade: z.number().min(0).max(10),
  comment: z.string().max(2000).nullable(),
  decidedBy: brandedId('UserId'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type TermEvaluation = z.infer<typeof termEvaluationSchema>;

export const createTermEvaluationInputSchema = termEvaluationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTermEvaluationInput = z.infer<typeof createTermEvaluationInputSchema>;

export const updateTermEvaluationInputSchema = createTermEvaluationInputSchema
  .pick({ finalGrade: true, comment: true })
  .partial();
export type UpdateTermEvaluationInput = z.infer<typeof updateTermEvaluationInputSchema>;
