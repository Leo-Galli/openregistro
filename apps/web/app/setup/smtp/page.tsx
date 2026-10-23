import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { SmtpForm } from '@/components/setup/smtp-form';
import { getStorage } from '@/lib/storage';

export default async function SmtpPage() {
  const storage = await getStorage();
  const settings = await storage.settings.get();

  return (
    <WizardShell activeSlug="smtp">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Used for notifications, meeting confirmations, and password resets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmtpForm
            defaults={{
              host: settings.smtp?.host ?? '',
              port: settings.smtp ? String(settings.smtp.port) : '587',
              user: settings.smtp?.user ?? '',
              from: settings.smtp?.from ?? '',
            }}
          />
        </CardContent>
      </Card>
    </WizardShell>
  );
}
