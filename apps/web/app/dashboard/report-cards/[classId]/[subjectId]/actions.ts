'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canTeacherActOnClassSubject,
  classIdSchema,
  subjectIdSchema,
  termIdSchema,
  userIdSchema,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const evaluationFormSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  studentId: z.string().uuid(),
  finalGrade: z.coerce.number().min(0).max(10),
  comment: z.string().max(2000).optional(),
});

export interface EvaluationFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'finalGrade', string>>;
  formError?: string;
}

export async function saveTermEvaluation(
  _prevState: EvaluationFormState,
  formData: FormData,
): Promise<EvaluationFormState> {
  const session = await auth();
  requirePermission(session!, 'reports:generate');
  const decidedBy = userIdOf(session!);

  const parsed = evaluationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: EvaluationFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'finalGrade') fieldErrors.finalGrade = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const subjectId = subjectIdSchema.parse(parsed.data.subjectId);
    const termId = termIdSchema.parse(parsed.data.termId);
    const studentId = userIdSchema.parse(parsed.data.studentId);

    if (session!.user.role !== 'school_admin') {
      const assignments = await storage.teacherAssignments.findMany({ classId });
      const decidedByAssignments = assignments.filter((a) => a.teacherId === decidedBy);
      if (
        session!.user.role === 'teacher' &&
        !canTeacherActOnClassSubject(decidedByAssignments, decidedBy, classId, subjectId)
      ) {
        return {
          ok: false,
          formError: 'You are not assigned to teach this subject in this class.',
        };
      }
    }

    const existing = await storage.termEvaluations.findMany({ studentId, subjectId, termId });
    const [existingEvaluation] = existing;

    if (existingEvaluation) {
      await storage.termEvaluations.update(existingEvaluation.id, {
        finalGrade: parsed.data.finalGrade,
        comment: parsed.data.comment || null,
      });
    } else {
      await storage.termEvaluations.create({
        studentId,
        subjectId,
        termId,
        finalGrade: parsed.data.finalGrade,
        comment: parsed.data.comment || null,
        decidedBy,
      });
    }

    revalidatePath(`/dashboard/report-cards/${classId}/${subjectId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the term evaluation.',
    };
  }
}
