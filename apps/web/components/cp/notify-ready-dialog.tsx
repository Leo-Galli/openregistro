'use client';

import { useActionState, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@openregistro/ui';
import { SubmitButton } from '@/components/submit-button';
import { notifyReadyAction, type NotifyReadyState } from '@/app/cp/actions';

const initialState: NotifyReadyState = { ok: false };

export function NotifyReadyDialog({
  id,
  schoolName,
  subdomain,
}: {
  id: string;
  schoolName: string;
  subdomain: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(notifyReadyAction, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" />
        Notify
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tell {schoolName} it&apos;s ready</DialogTitle>
          <DialogDescription>
            Sends the &quot;your instance is ready&quot; email with the address{' '}
            <code>{subdomain}.openregistro.another-horizon.eu</code>. Add an optional note below -
            it&apos;s included as an extra line in the email, exactly as written.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              name="note"
              rows={4}
              placeholder="e.g. Welcome aboard! Reach out any time if you need help getting set up."
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <SubmitButton pendingLabel="Sending...">Send</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
