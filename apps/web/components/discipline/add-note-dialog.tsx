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
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import {
  createDisciplinaryNote,
  type NoteFormState,
} from '@/app/dashboard/discipline/[classId]/actions';

const initialState: NoteFormState = { ok: false };

export function AddNoteDialog({
  classId,
  studentId,
  studentName,
}: {
  classId: string;
  studentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createDisciplinaryNote, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add note
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disciplinary note for {studentName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="studentId" value={studentId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} required />
            {state.fieldErrors?.description ? (
              <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
            ) : null}
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
