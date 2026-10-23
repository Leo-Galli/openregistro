'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { createSubject, type SubjectFormState } from '@/app/dashboard/school/subjects/actions';

const initialState: SubjectFormState = { ok: false };

export function CreateSubjectDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createSubject, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New subject
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New subject</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Mathematics" required />
            {state.fieldErrors?.name ? <p className="text-sm text-destructive">{state.fieldErrors.name}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shortCode">Short code</Label>
            <Input id="shortCode" name="shortCode" placeholder="MATH" maxLength={10} required />
            {state.fieldErrors?.shortCode ? (
              <p className="text-sm text-destructive">{state.fieldErrors.shortCode}</p>
            ) : null}
          </div>
          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
          <DialogFooter>
            <SubmitButton>Create</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
