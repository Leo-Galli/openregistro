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
      className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4"
      style={brandColorStyle(school?.primaryColor)}
    >
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
