import { randomUUID } from 'node:crypto';
import type { StorageDriver } from '@openregistro/core';
import { DEMO_READ_ONLY_MESSAGE } from './demo';

/**
 * Wraps a real StorageDriver so every mutating call pretends to succeed but
 * never touches the underlying store. Used only when DEMO_MODE=true so the
 * shared public demo stays stable for every visitor.
 *
 * shortcut: fake create payloads are a shallow spread of the input plus a
 * fresh id/timestamps - enough for Server Actions that only check the return
 * before revalidatePath (which reloads from the real, unchanged store).
 * Upgrade to a typed per-entity factory if an action ever depends on fields
 * the input did not carry.
 */
export function createDemoReadOnlyStorage(inner: StorageDriver): StorageDriver {
  const wrapRepo = <T>(repo: T): T => {
    if (repo === null || typeof repo !== 'object') return repo;
    return new Proxy(repo, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;

        if (prop === 'create') {
          return async (input: Record<string, unknown>) => {
            const now = new Date().toISOString();
            return {
              ...input,
              id: randomUUID(),
              createdAt: now,
              publishedAt: now,
              readAt: now,
              assignedDate: input.assignedDate ?? now.slice(0, 10),
              status: input.status ?? 'pending',
              reviewedBy: null,
              reviewedAt: null,
            };
          };
        }

        if (prop === 'update') {
          return async (id: string, input: Record<string, unknown>) => {
            const findById = Reflect.get(target, 'findById') as
              ((entityId: string) => Promise<Record<string, unknown> | null>) | undefined;
            const existing = findById ? await findById.call(target, id) : null;
            return { ...(existing ?? { id }), ...input, id };
          };
        }

        if (prop === 'delete') {
          return async () => undefined;
        }

        if (prop === 'review') {
          return async (id: string, status: string, reviewedBy: string) => {
            const findById = Reflect.get(target, 'findById') as (
              entityId: string,
            ) => Promise<Record<string, unknown> | null>;
            const existing = await findById.call(target, id);
            if (!existing) {
              throw new Error(DEMO_READ_ONLY_MESSAGE);
            }
            return {
              ...existing,
              status,
              reviewedBy,
              reviewedAt: new Date().toISOString(),
            };
          };
        }

        if (prop === 'complete') {
          return async () => {
            const get = Reflect.get(target, 'get') as () => Promise<unknown>;
            return get.call(target);
          };
        }

        return value.bind(target);
      },
    }) as T;
  };

  return {
    kind: inner.kind,
    connect: () => inner.connect(),
    disconnect: () => inner.disconnect(),
    healthCheck: () => inner.healthCheck(),
    installer: wrapRepo(inner.installer),
    settings: wrapRepo(inner.settings),
    users: wrapRepo(inner.users),
    schools: wrapRepo(inner.schools),
    schoolYears: wrapRepo(inner.schoolYears),
    terms: wrapRepo(inner.terms),
    classes: wrapRepo(inner.classes),
    subjects: wrapRepo(inner.subjects),
    teacherAssignments: wrapRepo(inner.teacherAssignments),
    enrollments: wrapRepo(inner.enrollments),
    guardianships: wrapRepo(inner.guardianships),
    lessonLogs: wrapRepo(inner.lessonLogs),
    attendanceRecords: wrapRepo(inner.attendanceRecords),
    absenceJustifications: wrapRepo(inner.absenceJustifications),
    grades: wrapRepo(inner.grades),
    disciplinaryNotes: wrapRepo(inner.disciplinaryNotes),
    homeworkAssignments: wrapRepo(inner.homeworkAssignments),
    timetableSlots: wrapRepo(inner.timetableSlots),
    calendarEvents: wrapRepo(inner.calendarEvents),
    meetingSlots: wrapRepo(inner.meetingSlots),
    meetingBookings: wrapRepo(inner.meetingBookings),
    announcements: wrapRepo(inner.announcements),
    announcementReadReceipts: wrapRepo(inner.announcementReadReceipts),
    termEvaluations: wrapRepo(inner.termEvaluations),
    auditLog: wrapRepo(inner.auditLog),
  };
}
