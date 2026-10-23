'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { userIdSchema, subjectIdSchema, classIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const enrollSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export interface SimpleActionState {
  ok: boolean;
  formError?: string;
}

export async function enrollStudent(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = enrollSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Choose a student to enroll.' };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    const klass = await storage.classes.findById(classId);
    if (!klass) return { ok: false, formError: 'Class not found.' };

    await storage.enrollments.create({
      studentId: userIdSchema.parse(parsed.data.studentId),
      classId,
      schoolYearId: klass.schoolYearId,
      enrolledAt: new Date().toISOString().slice(0, 10),
      withdrawnAt: null,
    });

    revalidatePath(`/dashboard/school/classes/${classId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, formError: error instanceof Error ? error.message : 'Could not enroll the student.' };
  }
}

const assignSchema = z.object({
  classId: z.string().uuid(),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  weeklyHours: z.coerce.number().min(0.5).max(40),
});

export async function assignTeacher(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Choose a teacher, subject, and weekly hours.' };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);
    await storage.teacherAssignments.create({
      teacherId: userIdSchema.parse(parsed.data.teacherId),
      classId,
      subjectId: subjectIdSchema.parse(parsed.data.subjectId),
      weeklyHours: parsed.data.weeklyHours,
    });
    revalidatePath(`/dashboard/school/classes/${classId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, formError: error instanceof Error ? error.message : 'Could not create the assignment.' };
  }
}

