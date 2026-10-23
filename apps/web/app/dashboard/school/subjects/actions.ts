'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const subjectFormSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  shortCode: z.string().min(1, 'Required').max(10),
});

export interface SubjectFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'name' | 'shortCode', string>>;
  formError?: string;
}

export async function createSubject(
  _prevState: SubjectFormState,
  formData: FormData,
): Promise<SubjectFormState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = subjectFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: SubjectFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as 'name' | 'shortCode'] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    await storage.subjects.create({
      schoolId: schoolIdOf(session!),
      name: parsed.data.name,
      shortCode: parsed.data.shortCode.toUpperCase(),
    });
    revalidatePath('/dashboard/school/subjects');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not create the subject.',
    };
  }
}
