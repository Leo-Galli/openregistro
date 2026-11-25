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
import { DemoBanner } from '@/components/demo-banner';
import { DemoQuickLogin } from '@/components/demo-quick-login';
import { LoginForm } from '@/components/login-form';
import { isDemoMode } from '@/lib/demo';
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
  const demo = isDemoMode();

  return (
    <div
      className="flex min-h-screen w-full flex-col bg-background"
      style={themeStyle(school?.themeId, school?.primaryColor)}
    >
      {demo ? <DemoBanner /> : null}
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Card className="shadow-hard-lg">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {school?.name ?? 'OpenRegistro'}
              </CardTitle>
              <CardDescription>
                {demo
                  ? 'Sign in with a demo account, or jump in with one click below.'
                  : 'Sign in to your school register.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              {demo ? <DemoQuickLogin /> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
