'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  attendanceRecordIdSchema,
  absenceJustificationIdSchema,
  isGuardianOfStudent,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const justifySchema = z.object({
  attendanceRecordId: z.string().uuid(),
  reason: z.string().min(1, 'Required').max(1000),
});

export interface JustifyFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'reason', string>>;
  formError?: string;
}

export async function submitJustification(
  _prevState: JustifyFormState,
  formData: FormData,
): Promise<JustifyFormState> {
  const session = await auth();
  requirePermission(session!, 'attendance:justify');
  const submittedBy = userIdOf(session!);

  const parsed = justifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: { reason: 'Required' } };
  }

  try {
    const storage = await getStorage();
    const attendanceRecordId = attendanceRecordIdSchema.parse(parsed.data.attendanceRecordId);
    const record = await storage.attendanceRecords.findById(attendanceRecordId);
    if (!record) return { ok: false, formError: 'Attendance record not found.' };

    if (session!.user.role === 'guardian') {
      const guardianships = await storage.guardianships.findMany({ guardianId: submittedBy });
      if (!isGuardianOfStudent(guardianships, submittedBy, record.studentId)) {
        return { ok: false, formError: 'You are not a guardian of this student.' };
      }
    } else if (record.studentId !== submittedBy) {
      return { ok: false, formError: 'You can only justify your own absences.' };
    }

    await storage.absenceJustifications.create({
      attendanceRecordId,
      submittedBy,
      reason: parsed.data.reason,
    });

    revalidatePath('/dashboard/attendance');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not submit the justification.',
    };
  }
}

const reviewSchema = z.object({
  justificationId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
});

export interface ReviewFormState {
  ok: boolean;
  formError?: string;
}

export async function reviewJustification(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const session = await auth();
  requirePermission(session!, 'attendance:review');
  const reviewerId = userIdOf(session!);

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Invalid request.' };
  }

  try {
    const storage = await getStorage();
    await storage.absenceJustifications.review(
      absenceJustificationIdSchema.parse(parsed.data.justificationId),
      parsed.data.decision,
      reviewerId,
    );
    revalidatePath('/dashboard/attendance');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not review the justification.',
    };
  }
}
