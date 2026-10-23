'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { calendarEventIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  type: z.enum(['test', 'event', 'holiday']),
  date: z.string().date(),
  description: z.string().max(2000).optional(),
});

export interface EventFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'title' | 'date', string>>;
  formError?: string;
}

export async function createCalendarEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await auth();
  requirePermission(session!, 'calendar:write');

  const parsed = eventFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: EventFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'title' || issue.path[0] === 'date') {
        fieldErrors[issue.path[0]] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  try {
    const storage = await getStorage();
    await storage.calendarEvents.create({
      classId: null,
      subjectId: null,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date,
      createdBy: userIdOf(session!),
    });

    revalidatePath('/dashboard/calendar');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not save the event.',
    };
  }
}

export async function deleteCalendarEvent(formData: FormData): Promise<void> {
  const session = await auth();
  requirePermission(session!, 'calendar:write');

  const id = calendarEventIdSchema.parse(formData.get('eventId'));
  const storage = await getStorage();
  await storage.calendarEvents.delete(id);
  revalidatePath('/dashboard/calendar');
}
