'use client';

import { useActionState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { addNotificationEmailAction, type AddNotificationEmailState } from '@/app/cp/actions';

const initialState: AddNotificationEmailState = { ok: false };

export function AddNotificationEmailForm() {
  const [state, formAction] = useActionState(addNotificationEmailAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-1.5">
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="max-w-xs"
        />
        <SubmitButton size="sm" pendingLabel="Adding...">
          <Plus className="h-3.5 w-3.5" />
          Add
        </SubmitButton>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.warning ? <p className="text-sm text-warning">{state.warning}</p> : null}
    </div>
  );
}
