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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { bookMeetingSlot, type BookFormState } from '@/app/dashboard/meetings/actions';

const initialState: BookFormState = { ok: false };

export function BookSlotDialog({
  meetingSlotId,
  students,
}: {
  meetingSlotId: string;
  students: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(bookMeetingSlot, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        Book
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book this meeting</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="meetingSlotId" value={meetingSlotId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-trigger">Student</Label>
            <Select name="studentId" defaultValue={students[0]?.id}>
              <SelectTrigger id="student-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

          <DialogFooter>
            <SubmitButton>Confirm booking</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
