'use client';

import { useActionState } from 'react';
import { Textarea } from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { updateNotificationEmailsAction, type NotificationEmailsState } from '@/app/cp/actions';

const initialState: NotificationEmailsState = { ok: false };

export function NotificationEmailsForm({ initialEmails }: { initialEmails: string[] }) {
  const [state, formAction] = useActionState(updateNotificationEmailsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="emails"
        rows={3}
        defaultValue={initialEmails.join('\n')}
        placeholder="you@example.com"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-success">Saved.</p> : null}
      <div>
        <SubmitButton size="sm" pendingLabel="Saving...">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}
