'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { announcementIdSchema, classIdSchema } from '@openregistro/core';
import { auth } from '@/auth';
import { requirePermission, schoolIdOf, userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';

const announcementFormSchema = z.object({
  classId: z.union([z.string().uuid(), z.literal('__school__')]),
  title: z.string().min(1, 'Required').max(200),
  body: z.string().min(1, 'Required').max(20000),
  attachmentFileName: z.string().max(255).optional().or(z.literal('')),
  attachmentUrl: z
    .string()
    .url()
    .refine((url) => /^https?:\/\//i.test(url), { message: 'Must be an http or https link' })
    .optional()
    .or(z.literal('')),
});

export interface AnnouncementFormState {
  ok: boolean;
  fieldErrors?: Partial<Record<'title' | 'body' | 'attachmentUrl', string>>;
  formError?: string;
}

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const session = await auth();
  requirePermission(session!, 'announcements:write');
  const authorId = userIdOf(session!);
  const schoolId = schoolIdOf(session!);

  const parsed = announcementFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: AnnouncementFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'title' || key === 'body' || key === 'attachmentUrl')
        fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  if (parsed.data.attachmentUrl && !parsed.data.attachmentFileName) {
    return {
      ok: false,
      fieldErrors: { attachmentUrl: 'Add a file name for the attachment link.' },
    };
  }

  try {
    const storage = await getStorage();

    await storage.announcements.create({
      schoolId,
      classId:
        parsed.data.classId === '__school__' ? null : classIdSchema.parse(parsed.data.classId),
      authorId,
      title: parsed.data.title,
      body: parsed.data.body,
      attachments:
        parsed.data.attachmentUrl && parsed.data.attachmentFileName
          ? [
              {
                fileName: parsed.data.attachmentFileName,
                url: parsed.data.attachmentUrl,
                mimeType: 'application/octet-stream',
                sizeBytes: 0,
              },
            ]
          : [],
    });

    revalidatePath('/dashboard/announcements');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not publish the announcement.',
    };
  }
}

export async function markAnnouncementRead(announcementId: string): Promise<void> {
  const session = await auth();
  requirePermission(session!, 'announcements:read');
  const userId = userIdOf(session!);

  const storage = await getStorage();
  const id = announcementIdSchema.parse(announcementId);
  const existing = await storage.announcementReadReceipts.findMany({ announcementId: id, userId });
  if (existing.length > 0) return;

  await storage.announcementReadReceipts.create({ announcementId: id, userId });
  revalidatePath('/dashboard/announcements');
}
