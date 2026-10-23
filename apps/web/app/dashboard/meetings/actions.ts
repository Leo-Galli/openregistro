'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { isGuardianOfStudent, meetingSlotIdSchema, userIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const slotFormSchema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  location: z.string().max(200).optional(),
  capacity: z.coerce.number().int().min(1).max(10),
});

export interface SlotFormState {
  ok: boolean;
  formError?: string;
}

export async function createMeetingSlot(
  _prevState: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const session = await auth();
  requirePermission(session!, 'meetings:manage');

  const parsed = slotFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Please fill in a valid start time, end time, and capacity.' };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (!(startsAt < endsAt)) {
    return { ok: false, formError: 'The end time must be after the start time.' };
  }

  try {
    const storage = await getStorage();
    await storage.meetingSlots.create({
      teacherId: userIdOf(session!),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: parsed.data.location || null,
      capacity: parsed.data.capacity,
    });

    revalidatePath('/dashboard/meetings');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the meeting slot.',
    };
  }
}

export async function deleteMeetingSlot(formData: FormData): Promise<void> {
  const session = await auth();
  requirePermission(session!, 'meetings:manage');

  const id = meetingSlotIdSchema.parse(formData.get('slotId'));
  const storage = await getStorage();
  const slot = await storage.meetingSlots.findById(id);
  if (!slot || slot.teacherId !== userIdOf(session!)) return;

  const bookings = await storage.meetingBookings.findMany({ meetingSlotId: id });
  if (bookings.length > 0) return;

  await storage.meetingSlots.delete(id);
  revalidatePath('/dashboard/meetings');
}

const bookFormSchema = z.object({
  meetingSlotId: z.string().uuid(),
  studentId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export interface BookFormState {
  ok: boolean;
  formError?: string;
}

export async function bookMeetingSlot(
  _prevState: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const session = await auth();
  requirePermission(session!, 'meetings:book');
  const guardianId = userIdOf(session!);

  const parsed = bookFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Choose a student.' };
  }

  try {
    const storage = await getStorage();
    const meetingSlotId = meetingSlotIdSchema.parse(parsed.data.meetingSlotId);
    const studentId = userIdSchema.parse(parsed.data.studentId);

    const guardianships = await storage.guardianships.findMany({ guardianId });
    if (!isGuardianOfStudent(guardianships, guardianId, studentId)) {
      return { ok: false, formError: 'You are not a guardian of this student.' };
    }

    const slot = await storage.meetingSlots.findById(meetingSlotId);
    if (!slot) return { ok: false, formError: 'This meeting slot no longer exists.' };

    const existingBookings = await storage.meetingBookings.findMany({ meetingSlotId });
    if (existingBookings.length >= slot.capacity) {
      return { ok: false, formError: 'This meeting slot is fully booked.' };
    }

    await storage.meetingBookings.create({
      meetingSlotId,
      guardianId,
      studentId,
      notes: parsed.data.notes || null,
    });

    revalidatePath('/dashboard/meetings');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not book the meeting.',
    };
  }
}
