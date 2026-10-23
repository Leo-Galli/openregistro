'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { submitJustification, type JustifyFormState } from '@/app/dashboard/attendance/actions';

const initialState: JustifyFormState = { ok: false };

export function JustifyDialog({
  attendanceRecordId,
  date,
}: {
  attendanceRecordId: string;
  date: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitJustification, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Justify
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Justify absence on {date}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="attendanceRecordId" value={attendanceRecordId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" rows={3} required />
            {state.fieldErrors?.reason ? (
              <p className="text-sm text-destructive">{state.fieldErrors.reason}</p>
            ) : null}
          </div>
          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
          <DialogFooter>
            <SubmitButton>Submit</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
