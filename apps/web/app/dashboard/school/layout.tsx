import type { ReactNode } from 'react';
import { auth } from '@/auth';
import { requirePermission } from '@/lib/authz';
import { SchoolTabs } from '@/components/school/school-tabs';

export default async function SchoolLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  requirePermission(session!, 'records:manage');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">School records</h1>
        <p className="text-sm text-muted-foreground">
          Manage classes, subjects, teachers, students, and families.
        </p>
      </div>
      <SchoolTabs />
      {children}
    </div>
  );
}
