import { redirect } from 'next/navigation';
import { hasPermission, type Permission, type SchoolId, type UserId } from '@openregistro/core';
import type { Session } from 'next-auth';

/**
 * The JWT session can only carry plain strings - re-branding here, once, at
 * the single boundary where session data crosses back into StorageDriver
 * calls, avoids scattering the same cast across every server action.
 */
export function schoolIdOf(session: Session): SchoolId {
  return session.user.schoolId as SchoolId;
}

export function userIdOf(session: Session): UserId {
  return session.user.id as UserId;
}

/**
 * Role-level check only. Call sites that act on a specific record (a class,
 * a student) must additionally check the relevant scope helper from
 * @openregistro/core's rbac/scope module with data loaded from the
 * StorageDriver - this function cannot know whether "this" teacher is
 * assigned to "this" class.
 *
 * Uses a plain redirect rather than Next's experimental `forbidden()` API:
 * that API still sits behind the `authInterrupts` experimental flag, and a
 * well-understood, stable redirect is preferable for security-critical code
 * other contributors will maintain.
 */
export function requirePermission(session: Session, permission: Permission): void {
  if (!hasPermission(session.user.role, permission)) {
    redirect('/forbidden');
  }
}

export function can(session: Session, permission: Permission): boolean {
  return hasPermission(session.user.role, permission);
}
