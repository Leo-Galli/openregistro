'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  classIdSchema,
  subjectIdSchema,
  timetableSlotIdSchema,
  userIdSchema,
} from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const slotFormSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weekday: z.coerce.number().int().min(1).max(7),
  hourSlot: z.coerce.number().int().min(1).max(8),
});

export interface SlotFormState {
  ok: boolean;
  formError?: string;
}

export async function addTimetableSlot(
  _prevState: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const session = await auth();
  requirePermission(session!, 'calendar:write');

  const parsed = slotFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Please choose a subject and teacher.' };
  }

  try {
    const storage = await getStorage();
    const classId = classIdSchema.parse(parsed.data.classId);

    const existing = await storage.timetableSlots.findMany({
      classId,
      weekday: parsed.data.weekday,
      hourSlot: parsed.data.hourSlot,
    });
    if (existing.length > 0) {
      return { ok: false, formError: 'This class already has a lesson scheduled at this time.' };
    }

    await storage.timetableSlots.create({
      classId,
      subjectId: subjectIdSchema.parse(parsed.data.subjectId),
      teacherId: userIdSchema.parse(parsed.data.teacherId),
      weekday: parsed.data.weekday,
      hourSlot: parsed.data.hourSlot,
    });

    revalidatePath(`/dashboard/timetable/${classId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the timetable slot.',
    };
  }
}

export async function removeTimetableSlot(formData: FormData): Promise<void> {
  const session = await auth();
  requirePermission(session!, 'calendar:write');

  const id = timetableSlotIdSchema.parse(formData.get('slotId'));
  const classId = classIdSchema.parse(formData.get('classId'));

  const storage = await getStorage();
  await storage.timetableSlots.delete(id);
  revalidatePath(`/dashboard/timetable/${classId}`);
}
