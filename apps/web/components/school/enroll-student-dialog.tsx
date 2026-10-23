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
import {
  enrollStudent,
  type SimpleActionState,
} from '@/app/dashboard/school/classes/[classId]/actions';

const initialState: SimpleActionState = { ok: false };

interface StudentOption {
  id: string;
  fullName: string;
}

export function EnrollStudentDialog({
  classId,
  students,
}: {
  classId: string;
  students: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(enrollStudent, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" disabled={students.length === 0} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Enroll student
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll a student</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studentId">Student</Label>
            <Select name="studentId">
              <SelectTrigger id="studentId">
                <SelectValue placeholder="Choose a student" />
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
          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
          <DialogFooter>
            <SubmitButton>Enroll</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
