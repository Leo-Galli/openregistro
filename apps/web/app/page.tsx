import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isInstallerComplete } from '@/lib/guards';

// Installer state and the session can change at any time; this route must
// never be served from a build-time static snapshot.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (!(await isInstallerComplete())) {
    redirect('/setup');
  }

  const session = await auth();
  redirect(session ? '/dashboard' : '/login');
}
