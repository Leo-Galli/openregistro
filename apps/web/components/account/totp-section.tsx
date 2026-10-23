'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@openregistro/ui';
import {
  confirmTotpEnrollment,
  disableTotp,
  startTotpEnrollment,
  type ConfirmTotpState,
  type TotpEnrollmentData,
} from '@/app/dashboard/account/actions';
import { SubmitButton } from '@/components/submit-button';

const initialState: ConfirmTotpState = { ok: false };

export function TotpSection({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [enrollment, setEnrollment] = useState<TotpEnrollmentData | null>(null);
  const [starting, setStarting] = useState(false);
  const [state, formAction] = useActionState(confirmTotpEnrollment, initialState);

  useEffect(() => {
    if (state.ok) {
      setEnabled(true);
      setEnrollment(null);
    }
  }, [state]);

  async function handleStart() {
    setStarting(true);
    try {
      setEnrollment(await startTotpEnrollment());
    } finally {
      setStarting(false);
    }
  }

  async function handleDisable() {
    await disableTotp();
    setEnabled(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Require a 6-digit code from an authenticator app in addition to your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {enabled ? (
          <>
            <p className="text-sm text-success">Two-factor authentication is enabled.</p>
            <Button variant="outline" className="w-fit" onClick={handleDisable}>
              Disable
            </Button>
          </>
        ) : enrollment ? (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="secret" value={enrollment.secret} />
            <img
              src={enrollment.qrDataUrl}
              alt="Scan this QR code with your authenticator app"
              width={200}
              height={200}
              className="rounded-md border border-border"
            />
            <p className="text-xs text-muted-foreground">
              Can&apos;t scan it? Enter this code manually: <code>{enrollment.secret}</code>
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" name="code" inputMode="numeric" maxLength={6} required />
            </div>
            {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
            <SubmitButton>Confirm</SubmitButton>
          </form>
        ) : (
          <Button className="w-fit" onClick={handleStart} disabled={starting}>
            {starting ? 'Generating...' : 'Enable two-factor authentication'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
