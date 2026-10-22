import type { ReactNode } from 'react';
import { requireInstallerIncomplete } from '@/lib/guards';

// The whole wizard reads and writes live storage state; it must never be
// served from a build-time static snapshot, and must re-lock immediately
// once the installer is completed.
export const dynamic = 'force-dynamic';

export default async function SetupLayout({ children }: { children: ReactNode }) {
  await requireInstallerIncomplete();
  return children;
}
