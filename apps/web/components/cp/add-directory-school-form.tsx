'use client';

import { useActionState, useEffect } from 'react';
import { Input, Label } from '@openregistro/ui';
import { addDirectorySchool, type DirectorySchoolFormState } from '@/app/cp/actions';
import { SubmitButton } from '@/components/submit-button';

const initialState: DirectorySchoolFormState = { ok: false };

export function AddDirectorySchoolForm() {
  const [state, action] = useActionState(addDirectorySchool, initialState);

  useEffect(() => {
    if (!state.ok) return;
    const form = document.getElementById('add-directory-school-form') as HTMLFormElement | null;
    form?.reset();
  }, [state]);

  return (
    <form id="add-directory-school-form" action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="directory-name">School name</Label>
          <Input id="directory-name" name="name" required maxLength={200} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="directory-url">Base URL</Label>
          <Input
            id="directory-url"
            name="baseUrl"
            required
            placeholder="https://registro.example.school.it"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="directory-notes">Notes (optional)</Label>
        <Input id="directory-notes" name="notes" maxLength={500} />
      </div>
      {state.error ? <p className="text-sm text-danger-600">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-success-600">Self-hosted school added to the app directory.</p>
      ) : null}
      <div>
        <SubmitButton>Add self-hosted school</SubmitButton>
      </div>
    </form>
  );
}
