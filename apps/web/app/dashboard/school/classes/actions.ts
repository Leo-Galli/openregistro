'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const classFormSchema = z.object({
  name: z.string().min(1, 'Required').max(50),
  gradeLevel: z.coerce.number().int().min(1).max(13),
});

export interface ClassFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'name' | 'gradeLevel', string>>;
  formError?: string;
}

export async function createClass(
  _prevState: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = classFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: ClassFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as 'name' | 'gradeLevel'] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const schoolId = schoolIdOf(session!);
    const [schoolYear] = await storage.schoolYears.findMany({ schoolId, isActive: true });
    if (!schoolYear) {
      return { ok: false, formError: 'No active school year is configured.' };
    }

    await storage.classes.create({
      schoolId,
      schoolYearId: schoolYear.id,
      name: parsed.data.name,
      gradeLevel: parsed.data.gradeLevel,
    });

    revalidatePath('/dashboard/school/classes');
    return { ok: true };
  } catch (error) {
    return { ok: false, formError: error instanceof Error ? error.message : 'Could not create the class.' };
  }
}
