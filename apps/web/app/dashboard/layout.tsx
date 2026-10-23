import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { requireSession } from '@/lib/guards';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader name={session.user.name ?? session.user.email ?? ''} role={session.user.role} />
      <DashboardNav role={session.user.role} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
