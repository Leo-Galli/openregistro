import { z } from 'zod';
import { brandedId, timestampSchema } from './common';
import { classIdSchema } from './academic-structure';
import { schoolIdSchema } from './school';

export const attachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z
    .number()
    .int()
    .min(0)
    .max(25 * 1024 * 1024),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const announcementIdSchema = brandedId('AnnouncementId');
export type AnnouncementId = z.infer<typeof announcementIdSchema>;

/** classId null means the announcement targets the whole school. */
export const announcementSchema = z.object({
  id: announcementIdSchema,
  schoolId: schoolIdSchema,
  classId: classIdSchema.nullable(),
  authorId: brandedId('UserId'),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  attachments: z.array(attachmentSchema).max(10),
  publishedAt: timestampSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Announcement = z.infer<typeof announcementSchema>;

export const createAnnouncementInputSchema = announcementSchema.omit({
  id: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementInputSchema>;

export const updateAnnouncementInputSchema = createAnnouncementInputSchema
  .pick({ title: true, body: true, attachments: true })
  .partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementInputSchema>;

export const announcementReadReceiptIdSchema = brandedId('AnnouncementReadReceiptId');
export type AnnouncementReadReceiptId = z.infer<typeof announcementReadReceiptIdSchema>;

export const announcementReadReceiptSchema = z.object({
  id: announcementReadReceiptIdSchema,
  announcementId: announcementIdSchema,
  userId: brandedId('UserId'),
  readAt: timestampSchema,
});

export type AnnouncementReadReceipt = z.infer<typeof announcementReadReceiptSchema>;

export const createAnnouncementReadReceiptInputSchema = announcementReadReceiptSchema.omit({
  id: true,
  readAt: true,
});
export type CreateAnnouncementReadReceiptInput = z.infer<
  typeof createAnnouncementReadReceiptInputSchema
>;
