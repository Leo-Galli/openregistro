'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, Input, Label } from '@openregistro/ui';
import { saveBranding, type BrandingFormState } from '@/app/dashboard/school/branding/actions';
import { ColorField } from './color-field';

const initialState: BrandingFormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save branding'}
    </Button>
  );
}

export function BrandingForm({ defaults }: { defaults: { name: string; primaryColor: string } }) {
  const [state, formAction] = useActionState(saveBranding, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">School name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <ColorField defaultValue={defaults.primaryColor} />
      {state.fieldErrors?.primaryColor ? (
        <p className="-mt-3 text-sm text-destructive">{state.fieldErrors.primaryColor}</p>
      ) : null}

      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
      {state.ok ? <p className="text-sm text-success">Branding saved.</p> : null}

      <SubmitButton />
    </form>
  );
}
