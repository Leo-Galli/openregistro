import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { auth } from '@/auth';
import { LoginForm } from '@/components/login-form';
import { requireInstallerComplete } from '@/lib/guards';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  await requireInstallerComplete();

  const session = await auth();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">OpenRegistro</CardTitle>
          <CardDescription>Sign in to your school register.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
