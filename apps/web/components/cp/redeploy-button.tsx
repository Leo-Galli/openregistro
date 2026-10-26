'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { redeployDemo, type RedeployState } from '@/app/cp/actions';

const initialState: RedeployState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      <RefreshCw className="h-3.5 w-3.5" />
      {pending ? 'Triggering redeploy...' : 'Redeploy latest to the demo'}
    </Button>
  );
}

export function RedeployButton() {
  const [state, formAction] = useActionState(redeployDemo, initialState);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction}>
        <SubmitButton />
      </form>
      {state.ok ? (
        <p className="text-sm text-success">
          Deploy triggered - check the Vercel dashboard for progress.
        </p>
      ) : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
