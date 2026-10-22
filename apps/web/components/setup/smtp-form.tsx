'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, Button, Input, Label } from '@openregistro/ui';
import { skipSmtpSetup, submitSmtpForm, type SmtpFormState } from '@/app/setup/smtp/actions';

const initialState: SmtpFormState = { ok: false };

interface SmtpFormDefaults {
  host: string;
  port: string;
  user: string;
  from: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value="save" disabled={pending}>
      {pending ? 'Saving...' : 'Save and continue'}
    </Button>
  );
}

function TestButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value="test" variant="secondary" disabled={pending}>
      {pending ? 'Sending...' : 'Send test email'}
    </Button>
  );
}

export function SmtpForm({ defaults }: { defaults: SmtpFormDefaults }) {
  const router = useRouter();
  const [state, formAction] = useActionState(submitSmtpForm, initialState);
  const [testRecipient, setTestRecipient] = useState('');

  useEffect(() => {
    if (state.ok) {
      router.push('/setup/demo');
    }
  }, [state.ok, router]);

  async function handleSkip() {
    await skipSmtpSetup();
    router.push('/setup/demo');
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Optional. Skip this step if you don&apos;t have an SMTP relay yet - you can configure
        email later.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="host">SMTP host</Label>
          <Input id="host" name="host" placeholder="smtp.example.com" defaultValue={defaults.host} />
          {state.fieldErrors?.host ? <p className="text-sm text-destructive">{state.fieldErrors.host}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="port">Port</Label>
          <Input id="port" name="port" type="number" defaultValue={defaults.port} />
          {state.fieldErrors?.port ? <p className="text-sm text-destructive">{state.fieldErrors.port}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user">Username (optional)</Label>
          <Input id="user" name="user" defaultValue={defaults.user} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password (optional)</Label>
          <Input id="password" name="password" type="password" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="from">From address</Label>
        <Input
          id="from"
          name="from"
          placeholder="OpenRegistro <no-reply@example.com>"
          defaultValue={defaults.from}
        />
        {state.fieldErrors?.from ? <p className="text-sm text-destructive">{state.fieldErrors.from}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="testRecipient">Send a test email to</Label>
        <Input
          id="testRecipient"
          name="testRecipient"
          type="email"
          value={testRecipient}
          onChange={(event) => setTestRecipient(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {state.testSent ? (
        <Alert variant="success">
          <CheckCircle2 className="h-5 w-5" />
          <AlertDescription>Test email sent - check the inbox above.</AlertDescription>
        </Alert>
      ) : null}
      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={handleSkip}>
          Skip for now
        </Button>
        <div className="flex gap-3">
          <TestButton />
          <SaveButton />
        </div>
      </div>
    </form>
  );
}
