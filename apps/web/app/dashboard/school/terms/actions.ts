'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const termFormSchema = z.object({
  kind: z.enum(['trimester', 'semester']),
  label: z.string().min(1, 'Required').max(50),
  sequence: z.coerce.number().int().min(1).max(10),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export interface TermFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'label' | 'sequence' | 'startDate' | 'endDate', string>>;
  formError?: string;
}

export async function createTerm(
  _prevState: TermFormState,
  formData: FormData,
): Promise<TermFormState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = termFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: TermFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'label' || key === 'sequence' || key === 'startDate' || key === 'endDate') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  if (parsed.data.endDate <= parsed.data.startDate) {
    return { ok: false, fieldErrors: { endDate: 'Must be after the start date' } };
  }

  try {
    const storage = await getStorage();
    const schoolId = schoolIdOf(session!);
    const [schoolYear] = await storage.schoolYears.findMany({ schoolId, isActive: true });
    if (!schoolYear) {
      return { ok: false, formError: 'No active school year is configured.' };
    }

    await storage.terms.create({
      schoolYearId: schoolYear.id,
      kind: parsed.data.kind,
      label: parsed.data.label,
      sequence: parsed.data.sequence,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });

    revalidatePath('/dashboard/school/terms');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not create the term.',
    };
  }
}
