'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canTeacherActOnClassSubject,
  classIdSchema,
  subjectIdSchema,
  homeworkAssignmentIdSchema,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const homeworkFormSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  title: z.string().min(1, 'Required').max(200),
  description: z.string().max(5000),
  assignedDate: z.string().date(),
  dueDate: z.string().date(),
});

export interface HomeworkFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'title' | 'assignedDate' | 'dueDate', string>>;
  formError?: string;
}

export async function createHomework(
  _prevState: HomeworkFormState,
  formData: FormData,
): Promise<HomeworkFormState> {
  const session = await auth();
  requirePermission(session!, 'homework:write');
  const teacherId = userIdOf(session!);

  const parsed = homeworkFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: HomeworkFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'title' || key === 'assignedDate' || key === 'dueDate')
        fieldErrors[key] = issue.message;
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

    await storage.homeworkAssignments.create({
      classId,
      subjectId,
      teacherId,
      title: parsed.data.title,
      description: parsed.data.description,
      assignedDate: parsed.data.assignedDate,
      dueDate: parsed.data.dueDate,
    });

    revalidatePath(`/dashboard/homework/${classId}/${subjectId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the homework assignment.',
    };
  }
}

export async function deleteHomework(formData: FormData): Promise<void> {
  const session = await auth();
  requirePermission(session!, 'homework:write');
  const teacherId = userIdOf(session!);

  const id = homeworkAssignmentIdSchema.parse(formData.get('homeworkAssignmentId'));
  const classId = classIdSchema.parse(formData.get('classId'));
  const subjectId = subjectIdSchema.parse(formData.get('subjectId'));

  const storage = await getStorage();
  const assignment = await storage.homeworkAssignments.findById(id);
  if (!assignment || assignment.teacherId !== teacherId) return;

  await storage.homeworkAssignments.delete(id);
  revalidatePath(`/dashboard/homework/${classId}/${subjectId}`);
}
