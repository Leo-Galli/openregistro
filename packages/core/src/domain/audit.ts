import { z } from 'zod';
import { brandedId, timestampSchema } from './common';

export const auditActionSchema = z.enum(['create', 'update', 'delete']);
export type AuditAction = z.infer<typeof auditActionSchema>;

export const auditEntitySchema = z.enum([
  'grade',
  'attendance_record',
  'absence_justification',
  'disciplinary_note',
  'term_evaluation',
  'user',
]);
export type AuditEntityKind = z.infer<typeof auditEntitySchema>;

export const auditLogEntryIdSchema = brandedId('AuditLogEntryId');
export type AuditLogEntryId = z.infer<typeof auditLogEntryIdSchema>;

/**
 * Audit log entries are append-only: the storage driver exposes create() and
 * findMany() for this entity but never update() or delete().
 */
export const auditLogEntrySchema = z.object({
  id: auditLogEntryIdSchema,
  actorId: brandedId('UserId'),
  action: auditActionSchema,
  entityKind: auditEntitySchema,
  entityId: z.string().uuid(),
  before: z.record(z.unknown()).nullable(),
  after: z.record(z.unknown()).nullable(),
  createdAt: timestampSchema,
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export const createAuditLogEntryInputSchema = auditLogEntrySchema.omit({
  id: true,
  createdAt: true,
});
export type CreateAuditLogEntryInput = z.infer<typeof createAuditLogEntryInputSchema>;
