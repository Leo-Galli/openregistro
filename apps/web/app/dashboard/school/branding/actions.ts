'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const brandingFormSchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #16304a')
    .optional()
    .or(z.literal('')),
});

export interface BrandingFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'name' | 'primaryColor', string>>;
  formError?: string;
}

export async function saveBranding(
  _prevState: BrandingFormState,
  formData: FormData,
): Promise<BrandingFormState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = brandingFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: BrandingFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'name' || key === 'primaryColor') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const schoolId = schoolIdOf(session!);
    const school = await storage.schools.findById(schoolId);
    if (!school) {
      return { ok: false, formError: 'School not found.' };
    }

    await storage.schools.update(schoolId, {
      name: parsed.data.name,
      primaryColor: parsed.data.primaryColor || null,
    });

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/login');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save branding.',
    };
  }
}
