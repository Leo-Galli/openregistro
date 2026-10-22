import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { DemoForm } from '@/components/setup/demo-form';

export default function DemoDataPage() {
  return (
    <WizardShell activeSlug="demo">
      <Card>
        <CardHeader>
          <CardTitle>Almost done</CardTitle>
          <CardDescription>One last choice before OpenRegistro is ready to use.</CardDescription>
        </CardHeader>
        <CardContent>
          <DemoForm />
        </CardContent>
      </Card>
    </WizardShell>
  );
}
