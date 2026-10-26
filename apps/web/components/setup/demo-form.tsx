'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button, Checkbox, Label } from '@openregistro/ui';
import { finishSetup, type FinishSetupState } from '@/app/setup/demo/actions';

const initialState: FinishSetupState = { ok: false };

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Finishing...' : 'Finish setup'}
    </Button>
  );
}

export function DemoForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(finishSetup, initialState);

  useEffect(() => {
    if (state.ok) {
      router.push('/login');
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-md border-2 border-border bg-muted/40 p-4">
        <Checkbox id="loadDemoData" name="loadDemoData" className="mt-0.5" />
        <div>
          <Label htmlFor="loadDemoData">Load demo data</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Adds a sample class, teacher, students, and a few grades and absences - all clearly
            fictional - so you can explore the app before entering real records.
          </p>
        </div>
      </div>

      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

      <p className="text-xs text-muted-foreground">
        After this step the setup wizard is permanently locked and cannot be reopened.
      </p>

      <div className="flex justify-end">
        <FinishButton />
      </div>
    </form>
  );
}
