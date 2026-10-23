'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { createClass, type ClassFormState } from '@/app/dashboard/school/classes/actions';

const initialState: ClassFormState = { ok: false };

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createClass, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New class
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>Classes belong to the current active school year.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="3A" required />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gradeLevel">Grade level</Label>
            <Input id="gradeLevel" name="gradeLevel" type="number" min={1} max={13} required />
            {state.fieldErrors?.gradeLevel ? (
              <p className="text-sm text-destructive">{state.fieldErrors.gradeLevel}</p>
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
