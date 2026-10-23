'use client';

import { useActionState, useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
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
  saveTermEvaluation,
  type EvaluationFormState,
} from '@/app/dashboard/report-cards/[classId]/[subjectId]/actions';

const initialState: EvaluationFormState = { ok: false };

export function SaveEvaluationDialog({
  classId,
  subjectId,
  termId,
  studentId,
  studentName,
  currentGrade,
  currentComment,
}: {
  classId: string;
  subjectId: string;
  termId: string;
  studentId: string;
  studentName: string;
  currentGrade: number | null;
  currentComment: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(saveTermEvaluation, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> {currentGrade !== null ? 'Edit' : 'Set grade'}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Term evaluation for {studentName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="termId" value={termId} />
          <input type="hidden" name="studentId" value={studentId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="finalGrade">Final grade</Label>
            <Input
              id="finalGrade"
              name="finalGrade"
              type="number"
              step="0.25"
              min="0"
              max="10"
              defaultValue={currentGrade ?? ''}
              required
            />
            {state.fieldErrors?.finalGrade ? (
              <p className="text-sm text-destructive">{state.fieldErrors.finalGrade}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea id="comment" name="comment" rows={3} defaultValue={currentComment ?? ''} />
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
