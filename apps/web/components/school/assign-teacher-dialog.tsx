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
import {
  assignTeacher,
  type SimpleActionState,
} from '@/app/dashboard/school/classes/[classId]/actions';

const initialState: SimpleActionState = { ok: false };

interface Option {
  id: string;
  label: string;
}

export function AssignTeacherDialog({
  classId,
  teachers,
  subjects,
}: {
  classId: string;
  teachers: Option[];
  subjects: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(assignTeacher, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Assign teacher
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a teacher</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="teacherId">Teacher</Label>
            <Select name="teacherId">
              <SelectTrigger id="teacherId">
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subjectId">Subject</Label>
            <Select name="subjectId">
              <SelectTrigger id="subjectId">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weeklyHours">Weekly hours</Label>
            <Input
              id="weeklyHours"
              name="weeklyHours"
              type="number"
              step="0.5"
              min="0.5"
              max="40"
              defaultValue="2"
              required
            />
          </div>
          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
          <DialogFooter>
            <SubmitButton>Assign</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
