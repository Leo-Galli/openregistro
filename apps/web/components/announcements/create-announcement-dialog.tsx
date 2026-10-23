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
  createAnnouncement,
  type AnnouncementFormState,
} from '@/app/dashboard/announcements/actions';

const initialState: AnnouncementFormState = { ok: false };

export function CreateAnnouncementDialog({ classes }: { classes: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createAnnouncement, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New announcement
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classId-trigger">Audience</Label>
            <Select name="classId" defaultValue="__school__">
              <SelectTrigger id="classId-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__school__">Whole school</SelectItem>
                {classes.map((klass) => (
                  <SelectItem key={klass.id} value={klass.id}>
                    {klass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={5} required />
            {state.fieldErrors?.body ? (
              <p className="text-sm text-destructive">{state.fieldErrors.body}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attachmentFileName">Attachment name (optional)</Label>
              <Input id="attachmentFileName" name="attachmentFileName" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attachmentUrl">Attachment link (optional)</Label>
              <Input id="attachmentUrl" name="attachmentUrl" type="url" placeholder="https://" />
              {state.fieldErrors?.attachmentUrl ? (
                <p className="text-sm text-destructive">{state.fieldErrors.attachmentUrl}</p>
              ) : null}
            </div>
          </div>

          {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}

          <DialogFooter>
            <SubmitButton>Publish</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
