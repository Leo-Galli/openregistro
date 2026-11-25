/**
 * Public-demo helpers. DEMO_MODE=true (exact string) on the managed demo
 * deployment only - never on a school's own install.
 */

export const DEMO_PASSWORD = 'DemoPassword123!';

export const DEMO_ACCOUNTS = {
  admin: {
    key: 'admin',
    role: 'School admin',
    email: 'admin@demo.openregistro.local',
    description: 'School records, accounts, the audit log, and term evaluations.',
  },
  teacher: {
    key: 'teacher',
    role: 'Teacher',
    email: 'teacher@demo.openregistro.local',
    description: 'The class register, gradebook, homework, and attendance.',
  },
  student: {
    key: 'student',
    role: 'Student',
    email: 'student1@demo.openregistro.local',
    description: 'Grades, homework, attendance, and announcements.',
  },
  guardian: {
    key: 'guardian',
    role: 'Guardian',
    email: 'guardian1@demo.openregistro.local',
    description: "A child's grades and attendance, plus absence justifications.",
  },
} as const;

export type DemoAccountKey = keyof typeof DEMO_ACCOUNTS;

export const DEMO_READ_ONLY_MESSAGE =
  'This public demo is read-only. You can explore every screen, but changes are not saved.';

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

export function getDemoAccount(key: string | null | undefined) {
  if (!key) return undefined;
  if (key in DEMO_ACCOUNTS) {
    return DEMO_ACCOUNTS[key as DemoAccountKey];
  }
  return undefined;
}
