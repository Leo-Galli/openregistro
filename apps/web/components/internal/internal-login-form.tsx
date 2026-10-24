'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, Input, Label } from '@openregistro/ui';
import { loginInternal, type InternalLoginState } from '@/app/internal/login/actions';

const initialState: InternalLoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Checking...' : 'Enter'}
    </Button>
  );
}

export function InternalLoginForm() {
  const [state, formAction] = useActionState(loginInternal, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="secret">Secret</Label>
        <Input id="secret" name="secret" type="password" autoComplete="off" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
