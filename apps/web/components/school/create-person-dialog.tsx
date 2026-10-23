'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { createPerson, type PersonFormState } from '@/app/dashboard/school/people/actions';

const initialState: PersonFormState = { ok: false };

interface StudentOption {
  id: string;
  fullName: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create account'}
    </Button>
  );
}

export function CreatePersonDialog({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'teacher' | 'student' | 'guardian'>('teacher');
  const [state, formAction] = useActionState(createPerson, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRole('teacher');
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New person
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              value={role}
              onValueChange={(value) => setRole(value as typeof role)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required />
            {state.fieldErrors?.fullName ? (
              <p className="text-sm text-destructive">{state.fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="password" required />
              {state.fieldErrors?.password ? (
                <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
              {state.fieldErrors?.confirmPassword ? (
                <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
          </div>

          {role === 'guardian' ? (
            <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/40 p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="linkedStudentId">Link to student (optional)</Label>
                <Select name="linkedStudentId">
                  <SelectTrigger id="linkedStudentId">
                    <SelectValue placeholder="No student selected" />
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
                <Label htmlFor="relationship">Relationship</Label>
                <Input id="relationship" name="relationship" placeholder="parent" />
              </div>
            </div>
          ) : null}

          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
