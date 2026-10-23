import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission, ROLE_PERMISSIONS, ROLES } from './roles';

describe('hasPermission', () => {
  it('grants school_admin every defined permission', () => {
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(hasPermission('school_admin', permission)).toBe(true);
      }
    }
  });

  it('denies students write access to grades', () => {
    expect(hasPermission('student', 'grades:write')).toBe(false);
    expect(hasPermission('student', 'grades:read')).toBe(true);
  });

  it('denies teachers school management permissions', () => {
    expect(hasPermission('teacher', 'school:manage')).toBe(false);
  });

  it('grants guardians the ability to justify absences but not write attendance', () => {
    expect(hasPermission('guardian', 'attendance:justify')).toBe(true);
    expect(hasPermission('guardian', 'attendance:write')).toBe(false);
  });

  it('grants students the ability to justify their own absences', () => {
    expect(hasPermission('student', 'attendance:justify')).toBe(true);
    expect(hasPermission('student', 'attendance:write')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when at least one permission matches', () => {
    expect(hasAnyPermission('teacher', ['school:manage', 'grades:write'])).toBe(true);
  });

  it('returns false when none match', () => {
    expect(hasAnyPermission('student', ['school:manage', 'grades:write'])).toBe(false);
  });
});
