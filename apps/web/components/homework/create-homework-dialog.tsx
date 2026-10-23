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
  createHomework,
  type HomeworkFormState,
} from '@/app/dashboard/homework/[classId]/[subjectId]/actions';

const initialState: HomeworkFormState = { ok: false };

export function CreateHomeworkDialog({
  classId,
  subjectId,
}: {
  classId: string;
  subjectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createHomework, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New homework
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New homework</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignedDate">Assigned on</Label>
              <Input
                id="assignedDate"
                name="assignedDate"
                type="date"
                defaultValue={today}
                required
              />
              {state.fieldErrors?.assignedDate ? (
                <p className="text-sm text-destructive">{state.fieldErrors.assignedDate}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due on</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={today} required />
              {state.fieldErrors?.dueDate ? (
                <p className="text-sm text-destructive">{state.fieldErrors.dueDate}</p>
              ) : null}
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
