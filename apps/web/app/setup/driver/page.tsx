import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { DriverTestPanel } from '@/components/setup/driver-test-panel';
import { getEnv } from '@/lib/env';

export default function DriverPage() {
  const env = getEnv();

  return (
    <WizardShell activeSlug="driver">
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Confirm OpenRegistro can read and write your data.</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverTestPanel driver={env.STORAGE_DRIVER} />
        </CardContent>
      </Card>
    </WizardShell>
  );
}
