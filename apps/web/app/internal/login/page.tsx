import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { isHostingAdmin } from '@/lib/hosting-admin';
import { InternalLoginForm } from '@/components/internal/internal-login-form';

export const dynamic = 'force-dynamic';

export default async function InternalLoginPage() {
  if (await isHostingAdmin()) {
    redirect('/internal/hosting-requests');
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-raised">
          <CardHeader>
            <CardTitle className="font-display text-xl">Internal</CardTitle>
            <CardDescription>Operator access only.</CardDescription>
          </CardHeader>
          <CardContent>
            <InternalLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
