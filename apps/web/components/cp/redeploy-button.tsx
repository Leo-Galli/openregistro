'use client';

import { useActionState } from 'react';
import { RefreshCw } from 'lucide-react';
import { redeployDemo, type RedeployState } from '@/app/cp/actions';
import { SubmitButton } from '@/components/submit-button';

const initialState: RedeployState = { ok: false };

export function RedeployButton() {
  const [state, formAction] = useActionState(redeployDemo, initialState);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction}>
        <SubmitButton variant="secondary" size="sm" pendingLabel="Triggering redeploy...">
          <RefreshCw className="h-3.5 w-3.5" />
          Redeploy latest to the demo
        </SubmitButton>
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
