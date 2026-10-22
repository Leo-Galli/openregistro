import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { AdminForm } from '@/components/setup/admin-form';
import { getStorage } from '@/lib/storage';

export default async function AdminPage() {
  const storage = await getStorage();
  const [school] = await storage.schools.findMany();
  if (!school) {
    redirect('/setup/school');
  }

  const [existingAdmin] = await storage.users.findMany({ role: 'school_admin' });

  return (
    <WizardShell activeSlug="admin">
      <Card>
        <CardHeader>
          <CardTitle>Administrator account</CardTitle>
          <CardDescription>
            You&apos;ll use this account to sign in once setup is complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingAdmin ? (
            <div className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                An administrator account already exists ({existingAdmin.email}).
              </p>
              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/setup/smtp">Continue</Link>
                </Button>
              </div>
            </div>
          ) : (
            <AdminForm />
          )}
        </CardContent>
      </Card>
    </WizardShell>
  );
}
