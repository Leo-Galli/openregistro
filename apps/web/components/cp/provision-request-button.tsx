'use client';

import { Rocket } from 'lucide-react';
import { provisionRequestAction } from '@/app/cp/actions';
import { SubmitButton } from '@/components/submit-button';

export function ProvisionRequestButton({ id }: { id: string }) {
  return (
    <form action={provisionRequestAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="secondary" pendingLabel="Creating project...">
        <Rocket className="h-3.5 w-3.5" />
        Create project
      </SubmitButton>
    </form>
  );
}
