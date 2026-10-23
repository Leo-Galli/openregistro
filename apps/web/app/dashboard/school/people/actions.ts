'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { userIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { hashPassword } from '@/lib/password';
import { logAudit } from '@/lib/audit';

const personFormSchema = z
  .object({
    role: z.enum(['teacher', 'student', 'guardian']),
    fullName: z.string().min(1, 'Required').max(200),
    email: z.string().email(),
    password: z.string().min(12, 'At least 12 characters'),
    confirmPassword: z.string().min(1),
    linkedStudentId: z.string().uuid().optional().or(z.literal('')),
    relationship: z.string().max(50).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PersonFormInput = z.infer<typeof personFormSchema>;

export interface PersonFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<keyof PersonFormInput, string>>;
  formError?: string;
}

export async function createPerson(
  _prevState: PersonFormState,
  formData: FormData,
): Promise<PersonFormState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = personFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: PersonFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof PersonFormInput] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    const passwordHash = await hashPassword(parsed.data.password);

    const user = await storage.users.create({
      schoolId: schoolIdOf(session!),
      role: parsed.data.role,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      passwordHash,
      totpSecret: null,
      isActive: true,
      lastLoginAt: null,
    });

    if (parsed.data.role === 'guardian' && parsed.data.linkedStudentId) {
      await storage.guardianships.create({
        guardianId: user.id,
        studentId: userIdSchema.parse(parsed.data.linkedStudentId),
        relationship: parsed.data.relationship || 'parent',
        isPrimaryContact: true,
      });
    }

    await logAudit(storage, {
      actorId: userIdOf(session!),
      action: 'create',
      entityKind: 'user',
      entityId: user.id,
      after: { role: user.role, email: user.email, fullName: user.fullName },
    });

    revalidatePath('/dashboard/school/people');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not create the account.',
    };
  }
}
