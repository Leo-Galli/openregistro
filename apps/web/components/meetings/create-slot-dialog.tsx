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
import { createMeetingSlot, type SlotFormState } from '@/app/dashboard/meetings/actions';

const initialState: SlotFormState = { ok: false };

export function CreateSlotDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createMeetingSlot, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New meeting slot
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New meeting slot</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input id="startsAt" name="startsAt" type="datetime-local" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endsAt">Ends at</Label>
              <Input id="endsAt" name="endsAt" type="datetime-local" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" name="location" placeholder="Room 12" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                max="10"
                defaultValue="1"
                required
              />
            </div>
          </div>

          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

          <DialogFooter>
            <SubmitButton>Save</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
