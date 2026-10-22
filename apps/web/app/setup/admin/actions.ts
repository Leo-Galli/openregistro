'use server';

import { z } from 'zod';
import { getStorage } from '@/lib/storage';
import { hashPassword } from '@/lib/password';

const adminFormSchema = z
  .object({
    fullName: z.string().min(1, 'Required').max(200),
    email: z.string().email(),
    password: z.string().min(12, 'At least 12 characters'),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AdminFormInput = z.infer<typeof adminFormSchema>;

export interface AdminFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<keyof AdminFormInput, string>>;
  formError?: string;
}

export async function createAdminAccount(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: AdminFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof AdminFormInput;
      fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const [school] = await storage.schools.findMany();
    if (!school) {
      return { ok: false, formError: 'Save your school details first.' };
    }

    const [existingAdmin] = await storage.users.findMany({ role: 'school_admin' });
    if (existingAdmin) {
      return { ok: true };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await storage.users.create({
      schoolId: school.id,
      role: 'school_admin',
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      passwordHash,
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not create the admin account.',
    };
  }
}
