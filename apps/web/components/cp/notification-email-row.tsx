'use client';

import { useActionState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import {
  removeNotificationEmailAction,
  resendWelcomeEmailAction,
  type ResendWelcomeEmailState,
} from '@/app/cp/actions';

const initialState: ResendWelcomeEmailState = { ok: false };

export function NotificationEmailRow({ email }: { email: string }) {
  const [state, formAction] = useActionState(resendWelcomeEmailAction, initialState);

  return (
    <div className="flex flex-col gap-1 rounded-lg border-2 border-border bg-surface px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{email}</span>
        <div className="flex items-center gap-1.5">
          <form action={formAction}>
            <input type="hidden" name="email" value={email} />
            <SubmitButton
              size="sm"
              variant="outline"
              pendingLabel="Sending..."
              title="Resend the welcome email"
            >
              <Send className="h-3.5 w-3.5" />
              Resend
            </SubmitButton>
          </form>
          <form action={removeNotificationEmailAction}>
            <input type="hidden" name="email" value={email} />
            <Button type="submit" size="icon" variant="ghost" title="Remove from the list">
              <X className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-xs text-success">Sent.</p> : null}
    </div>
  );
}
