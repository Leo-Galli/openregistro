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
  type Grade,
  type SchoolId,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { sendPlatformEmail, platformEmailEnabledFor } from '@/lib/platform-mailer';
import { renderBrandedEmail } from '@/lib/email-templates';
import type { StorageDriver } from '@openregistro/core';

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

    const grade = await storage.grades.create({
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

    await logAudit(storage, {
      actorId: teacherId,
      action: 'create',
      entityKind: 'grade',
      entityId: grade.id,
      after: {
        studentId: grade.studentId,
        value: grade.value,
        weight: grade.weight,
        type: grade.type,
      },
    });

    await notifyGuardiansOfGrade(storage, schoolIdOf(session!), grade);

    revalidatePath(`/dashboard/gradebook/${classId}/${subjectId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the grade.',
    };
  }
}

/**
 * Best-effort notification, never allowed to affect the grade-save result:
 * a platform-mailbox hiccup must not make an otherwise-successful grade
 * entry look like it failed. Only sends anything when the school opted in
 * via usePlatformEmail AND this instance is actually platform-hosted (see
 * lib/platform-mailer.ts) - inert on every self-hosted install.
 */
async function notifyGuardiansOfGrade(
  storage: StorageDriver,
  schoolId: SchoolId,
  grade: Grade,
): Promise<void> {
  try {
    const school = await storage.schools.findById(schoolId);
    if (!school || !platformEmailEnabledFor(school.usePlatformEmail)) return;

    const [student, subject, guardianships] = await Promise.all([
      storage.users.findById(grade.studentId),
      storage.subjects.findById(grade.subjectId),
      storage.guardianships.findMany({ studentId: grade.studentId }),
    ]);
    if (!student) return;

    const guardians = (
      await Promise.all(guardianships.map((g) => storage.users.findById(g.guardianId)))
    ).filter((guardian): guardian is NonNullable<typeof guardian> => guardian !== null);

    if (guardians.length === 0) return;

    const { html, text } = renderBrandedEmail({
      preheader: `New grade for ${student.fullName}`,
      heading: 'New grade recorded',
      bodyLines: [
        `A new grade was recorded for ${student.fullName}${subject ? ` in ${subject.name}` : ''}.`,
        `Grade: ${grade.value} (weight ${grade.weight})`,
        ...(grade.note ? [`Note: ${grade.note}`] : []),
        'Sign in to the register to see the full gradebook.',
      ],
      footnote: `${school.name} enabled grade notification emails for this account.`,
    });

    await Promise.all(
      guardians.map((guardian) =>
        sendPlatformEmail({
          to: guardian.email,
          subject: `New grade for ${student.fullName}`,
          text,
          html,
        }),
      ),
    );
  } catch (error) {
    console.error('notifyGuardiansOfGrade failed.', error);
  }
}
