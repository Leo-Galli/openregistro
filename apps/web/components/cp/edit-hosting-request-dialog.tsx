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
import { editHostingRequest, type EditHostingRequestState } from '@/app/cp/actions';
import type { HostingRequest } from '@openregistro/db';

const initialState: EditHostingRequestState = { ok: false };

export function EditHostingRequestDialog({ request }: { request: HostingRequest }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(editHostingRequest, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit hosting request</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={request.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schoolName">School name</Label>
            <Input id="schoolName" name="schoolName" defaultValue={request.schoolName} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={request.contactName}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={request.contactEmail}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approxStudents">Approximate students</Label>
            <Input
              id="approxStudents"
              name="approxStudents"
              type="number"
              min={1}
              defaultValue={request.approxStudents ?? ''}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={3} defaultValue={request.message ?? ''} />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <SubmitButton>Save changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
