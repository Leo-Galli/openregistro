import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  themeStyle,
} from '@openregistro/ui';
import { auth } from '@/auth';
import { LoginForm } from '@/components/login-form';
import { requireInstallerComplete } from '@/lib/guards';
import { getStorage } from '@/lib/storage';

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
      className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4"
      style={themeStyle(school?.themeId, school?.primaryColor)}
    >
      <div className="w-full max-w-sm">
        <Card className="shadow-hard-lg">
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
