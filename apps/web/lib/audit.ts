import type { AuditAction, AuditEntityKind, StorageDriver, UserId } from '@openregistro/core';

export async function logAudit(
  storage: StorageDriver,
  params: {
    actorId: UserId;
    action: AuditAction;
    entityKind: AuditEntityKind;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  },
): Promise<void> {
  await storage.auditLog.create({
    actorId: params.actorId,
    action: params.action,
    entityKind: params.entityKind,
    entityId: params.entityId,
    before: params.before ?? null,
    after: params.after ?? null,
  });
}
