'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canTeacherActOnClassSubject,
  classIdSchema,
  subjectIdSchema,
  termIdSchema,
  userIdSchema,
  gradeTypeSchema,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const gradeFormSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  studentId: z.string().uuid(),
  type: gradeTypeSchema,
  value: z.coerce.number().min(0).max(10),
  weight: z.coerce.number().min(0.1).max(5),
  date: z.string().date(),
  note: z.string().max(500).optional(),
});

export interface GradeFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'value' | 'weight' | 'date', string>>;
  formError?: string;
}

export async function createGrade(
  _prevState: GradeFormState,
  formData: FormData,
): Promise<GradeFormState> {
  const session = await auth();
  requirePermission(session!, 'grades:write');
  const teacherId = userIdOf(session!);

  const parsed = gradeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: GradeFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'value' || key === 'weight' || key === 'date') fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const subjectId = subjectIdSchema.parse(parsed.data.subjectId);

    const assignments = await storage.teacherAssignments.findMany({ teacherId, classId });
    if (!canTeacherActOnClassSubject(assignments, teacherId, classId, subjectId)) {
      return { ok: false, formError: 'You are not assigned to teach this subject in this class.' };
    }

    await storage.grades.create({
      studentId: userIdSchema.parse(parsed.data.studentId),
      classId,
      subjectId,
      termId: termIdSchema.parse(parsed.data.termId),
      teacherId,
      type: parsed.data.type,
      value: parsed.data.value,
      weight: parsed.data.weight,
      date: parsed.data.date,
      note: parsed.data.note || null,
    });

    revalidatePath(`/dashboard/gradebook/${classId}/${subjectId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the grade.',
    };
  }
}
