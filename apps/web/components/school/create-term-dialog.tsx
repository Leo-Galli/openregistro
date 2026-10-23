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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { createTerm, type TermFormState } from '@/app/dashboard/school/terms/actions';

const initialState: TermFormState = { ok: false };

export function CreateTermDialog({ nextSequence }: { nextSequence: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTerm, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New term
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New term</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kind">Kind</Label>
              <Select name="kind" defaultValue="trimester">
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimester">Trimester</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sequence">Sequence</Label>
              <Input
                id="sequence"
                name="sequence"
                type="number"
                min={1}
                max={10}
                defaultValue={nextSequence}
                required
              />
              {state.fieldErrors?.sequence ? (
                <p className="text-sm text-destructive">{state.fieldErrors.sequence}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder="First trimester" required />
            {state.fieldErrors?.label ? (
              <p className="text-sm text-destructive">{state.fieldErrors.label}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Starts on</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">Ends on</Label>
              <Input id="endDate" name="endDate" type="date" required />
              {state.fieldErrors?.endDate ? (
                <p className="text-sm text-destructive">{state.fieldErrors.endDate}</p>
              ) : null}
            </div>
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
