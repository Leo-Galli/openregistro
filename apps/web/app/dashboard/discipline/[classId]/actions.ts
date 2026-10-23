'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { classIdSchema, hasAnyPermission, userIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { logAudit } from '@/lib/audit';

const noteFormSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().date(),
  description: z.string().min(1, 'Required').max(2000),
});

export interface NoteFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'description', string>>;
  formError?: string;
}

export async function createDisciplinaryNote(
  _prevState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const session = await auth();
  if (!session || !hasAnyPermission(session.user.role, ['register:write', 'records:manage'])) {
    return { ok: false, formError: 'You do not have permission to add a note.' };
  }
  const authorId = userIdOf(session);

  const parsed = noteFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: NoteFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'description') fieldErrors.description = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const studentId = userIdSchema.parse(parsed.data.studentId);

    if (session.user.role === 'teacher') {
      const assignments = await storage.teacherAssignments.findMany({
        teacherId: authorId,
        classId,
      });
      if (assignments.length === 0) {
        return { ok: false, formError: 'You are not assigned to this class.' };
      }
    }

    const note = await storage.disciplinaryNotes.create({
      studentId,
      classId,
      authorId,
      date: parsed.data.date,
      description: parsed.data.description,
    });

    await logAudit(storage, {
      actorId: authorId,
      action: 'create',
      entityKind: 'disciplinary_note',
      entityId: note.id,
      after: { studentId: note.studentId, date: note.date },
    });

    revalidatePath(`/dashboard/discipline/${classId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the note.',
    };
  }
}
