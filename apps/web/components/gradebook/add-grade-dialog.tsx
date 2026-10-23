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
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import {
  createGrade,
  type GradeFormState,
} from '@/app/dashboard/gradebook/[classId]/[subjectId]/actions';

const initialState: GradeFormState = { ok: false };

export function AddGradeDialog({
  classId,
  subjectId,
  termId,
  studentId,
  studentName,
}: {
  classId: string;
  subjectId: string;
  termId: string;
  studentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createGrade, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add grade
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New grade for {studentName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="termId" value={termId} />
          <input type="hidden" name="studentId" value={studentId} />

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="written">
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="written">Written</SelectItem>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" step="0.25" min="0" max="10" required />
              {state.fieldErrors?.value ? (
                <p className="text-sm text-destructive">{state.fieldErrors.value}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.5"
                min="0"
                max="5"
                defaultValue="1"
                required
              />
              {state.fieldErrors?.weight ? (
                <p className="text-sm text-destructive">{state.fieldErrors.weight}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
            {state.fieldErrors?.date ? (
              <p className="text-sm text-destructive">{state.fieldErrors.date}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" name="note" rows={2} />
          </div>

          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

          <DialogFooter>
            <SubmitButton>Save grade</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
