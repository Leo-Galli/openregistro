import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { LoginForm } from '@/components/login-form';
import { requireInstallerComplete } from '@/lib/guards';
import { getStorage } from '@/lib/storage';
import { brandColorStyle } from '@/lib/brand-color';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  await requireInstallerComplete();

  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }

  const storage = await getStorage();
  const [school] = await storage.schools.findMany();

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4"
      style={brandColorStyle(school?.primaryColor)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[30rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <Card className="shadow-raised">
          <CardHeader>
            <CardTitle className="font-display text-xl">{school?.name ?? 'OpenRegistro'}</CardTitle>
            <CardDescription>Sign in to your school register.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
