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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { addTimetableSlot, type SlotFormState } from '@/app/dashboard/timetable/[classId]/actions';

const initialState: SlotFormState = { ok: false };

export interface AssignmentOption {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export function AddSlotDialog({
  classId,
  weekday,
  hourSlot,
  assignments,
}: {
  classId: string;
  weekday: number;
  hourSlot: number;
  assignments: AssignmentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addTimetableSlot, initialState);
  const firstAssignment = assignments[0];
  const [selected, setSelected] = useState(
    firstAssignment ? `${firstAssignment.subjectId}:${firstAssignment.teacherId}` : '',
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  const [subjectId, teacherId] = selected.split(':');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Add lesson">
        <Plus className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a lesson</DialogTitle>
        </DialogHeader>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No teacher is assigned to a subject in this class yet.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="weekday" value={weekday} />
            <input type="hidden" name="hourSlot" value={hourSlot} />
            <input type="hidden" name="subjectId" value={subjectId ?? ''} />
            <input type="hidden" name="teacherId" value={teacherId ?? ''} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-trigger">Subject and teacher</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger id="assignment-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem
                      key={`${assignment.subjectId}:${assignment.teacherId}`}
                      value={`${assignment.subjectId}:${assignment.teacherId}`}
                    >
                      {assignment.subjectName} - {assignment.teacherName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

            <DialogFooter>
              <SubmitButton>Add</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
