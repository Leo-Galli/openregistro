'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Label, Textarea } from '@openregistro/ui';
import { HOSTING_REQUEST_API_URL } from '@/lib/constants';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function HostRequestForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');

    const form = event.currentTarget;
    const data = new FormData(form);
    const approxStudents = data.get('approxStudents');

    try {
      const response = await fetch(HOSTING_REQUEST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: data.get('schoolName'),
          contactName: data.get('contactName'),
          contactEmail: data.get('contactEmail'),
          approxStudents: approxStudents ? Number(approxStudents) : null,
          message: data.get('message') || null,
        }),
      });

      if (!response.ok) throw new Error('request failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm shadow-soft">
        Thanks - your request has been received. We&apos;ll set up your free instance and reach out
        by email with the details.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schoolName">School name</Label>
        <Input id="schoolName" name="schoolName" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactName">Your name</Label>
          <Input id="contactName" name="contactName" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="approxStudents">Approximate number of students (optional)</Label>
        <Input id="approxStudents" name="approxStudents" type="number" min={1} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Anything else we should know? (optional)</Label>
        <Textarea id="message" name="message" rows={4} />
      </div>
      {status === 'error' ? (
        <p className="text-sm text-destructive">
          Something went wrong sending your request. Please try again or email us directly.
        </p>
      ) : null}
      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send request'}
      </Button>
    </form>
  );
}
