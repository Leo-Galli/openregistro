export const ROLES = [
  'school_admin',
  'secretary',
  'principal',
  'teacher',
  'student',
  'guardian',
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'school:manage',
  'users:manage',
  'records:manage',
  'register:write',
  'register:read',
  'grades:write',
  'grades:read',
  'attendance:write',
  'attendance:justify',
  'homework:write',
  'homework:read',
  'announcements:write',
  'announcements:read',
  'meetings:manage',
  'meetings:book',
  'calendar:write',
  'calendar:read',
  'reports:generate',
  'reports:read',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  school_admin: ALL_PERMISSIONS,
  secretary: [
    'records:manage',
    'register:read',
    'grades:read',
    'attendance:write',
    'announcements:write',
    'announcements:read',
    'meetings:manage',
    'calendar:write',
    'calendar:read',
    'reports:generate',
    'reports:read',
  ],
  principal: [
    'records:manage',
    'register:read',
    'grades:read',
    'attendance:write',
    'homework:read',
    'announcements:write',
    'announcements:read',
    'meetings:manage',
    'calendar:write',
    'calendar:read',
    'reports:generate',
    'reports:read',
    'audit:read',
  ],
  teacher: [
    'register:write',
    'register:read',
    'grades:write',
    'grades:read',
    'attendance:write',
    'homework:write',
    'homework:read',
    'announcements:write',
    'announcements:read',
    'meetings:manage',
    'meetings:book',
    'calendar:read',
    'reports:read',
  ],
  student: [
    'register:read',
    'grades:read',
    'homework:read',
    'announcements:read',
    'calendar:read',
    'reports:read',
  ],
  guardian: [
    'register:read',
    'grades:read',
    'attendance:justify',
    'homework:read',
    'announcements:read',
    'meetings:book',
    'calendar:read',
    'reports:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
