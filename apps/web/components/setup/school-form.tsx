'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button, Input, Label } from '@openregistro/ui';
import { saveSchoolDetails, type SchoolFormState } from '@/app/setup/school/actions';

const initialState: SchoolFormState = { ok: false };

interface SchoolFormDefaults {
  name: string;
  address: string;
  contactEmail: string;
  primaryColor: string;
  yearLabel: string;
  startDate: string;
  endDate: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Continue'}
    </Button>
  );
}

export function SchoolForm({ defaults }: { defaults: SchoolFormDefaults }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveSchoolDetails, initialState);

  useEffect(() => {
    if (state.ok) {
      router.push('/setup/admin');
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">School name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" name="address" defaultValue={defaults.address} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Contact email (optional)</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaults.contactEmail}
          />
          {state.fieldErrors?.contactEmail ? (
            <p className="text-sm text-destructive">{state.fieldErrors.contactEmail}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryColor">Brand color (optional)</Label>
          <Input
            id="primaryColor"
            name="primaryColor"
            placeholder="#16304a"
            defaultValue={defaults.primaryColor}
          />
          {state.fieldErrors?.primaryColor ? (
            <p className="text-sm text-destructive">{state.fieldErrors.primaryColor}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yearLabel">Current school year label</Label>
        <Input
          id="yearLabel"
          name="yearLabel"
          placeholder="2025/2026"
          defaultValue={defaults.yearLabel}
          required
        />
        {state.fieldErrors?.yearLabel ? (
          <p className="text-sm text-destructive">{state.fieldErrors.yearLabel}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Starts on</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaults.startDate}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">Ends on</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={defaults.endDate} required />
          {state.fieldErrors?.endDate ? (
            <p className="text-sm text-destructive">{state.fieldErrors.endDate}</p>
          ) : null}
        </div>
      </div>

      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
