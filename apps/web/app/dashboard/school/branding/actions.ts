'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { THEMES } from '@openregistro/ui';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { getEnv } from '@/lib/env';

const brandingFormSchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  themeId: z.enum(THEMES.map((theme) => theme.id) as [string, ...string[]]),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #16304a')
    .optional()
    .or(z.literal('')),
  // Native checkboxes omit themselves from FormData entirely when unchecked,
  // rather than submitting "false" - treat anything other than the checked
  // value as off.
  usePlatformEmail: z.preprocess((value) => value === 'on', z.boolean()),
});

export interface BrandingFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'name' | 'themeId' | 'primaryColor', string>>;
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
      if (key === 'name' || key === 'themeId' || key === 'primaryColor') {
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

    // Defense in depth: even if this were somehow POSTed with the toggle on,
    // a self-hosted instance has no shared mailbox to use it with - force it
    // off unless the running instance is actually platform-hosted.
    const { PLATFORM_HOSTED } = getEnv();

    await storage.schools.update(schoolId, {
      name: parsed.data.name,
      themeId: parsed.data.themeId,
      primaryColor: parsed.data.primaryColor || null,
      usePlatformEmail: PLATFORM_HOSTED && parsed.data.usePlatformEmail,
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
