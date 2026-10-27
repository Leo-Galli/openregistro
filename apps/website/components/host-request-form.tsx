'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Input, Label, Textarea } from '@openregistro/ui';
import { HOSTING_REQUEST_API_URL, CHECK_SUBDOMAIN_API_URL } from '@/lib/constants';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type SubdomainCheck = 'idle' | 'checking' | 'available' | 'unavailable';

function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export function HostRequestForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState('');
  const [subdomainCheck, setSubdomainCheck] = useState<SubdomainCheck>('idle');
  const [subdomainReason, setSubdomainReason] = useState<string | null>(null);
  const checkRequestId = useRef(0);

  useEffect(() => {
    if (!subdomain) {
      setSubdomainCheck('idle');
      setSubdomainReason(null);
      return;
    }

    setSubdomainCheck('checking');
    const requestId = ++checkRequestId.current;
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `${CHECK_SUBDOMAIN_API_URL}?subdomain=${encodeURIComponent(subdomain)}`,
        );
        const data = (await response.json()) as { available: boolean; reason?: string };
        if (checkRequestId.current !== requestId) return; // a newer check superseded this one
        setSubdomainCheck(data.available ? 'available' : 'unavailable');
        setSubdomainReason(data.reason ?? null);
      } catch {
        if (checkRequestId.current !== requestId) return;
        setSubdomainCheck('idle');
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [subdomain]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

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
          requestedSubdomain: subdomain || null,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(body?.error ?? null);
        throw new Error('request failed');
      }
      setStatus('success');
      form.reset();
      setSubdomain('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="rounded-xl border-2 border-border bg-surface p-6 text-sm shadow-hard-sm">
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
        <Label htmlFor="subdomain">Choose your subdomain (optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="yourschool"
            value={subdomain}
            onChange={(event) => setSubdomain(slugifyInput(event.target.value))}
            className="flex-1"
          />
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            .openregistro.another-horizon.eu
          </span>
        </div>
        {subdomainCheck === 'checking' ? (
          <p className="text-xs text-muted-foreground">Checking availability...</p>
        ) : null}
        {subdomainCheck === 'available' ? <p className="text-xs text-success">Available.</p> : null}
        {subdomainCheck === 'unavailable' ? (
          <p className="text-xs text-destructive">
            {subdomainReason ?? 'That subdomain is already taken.'}
          </p>
        ) : null}
        {subdomainCheck === 'idle' && !subdomain ? (
          <p className="text-xs text-muted-foreground">
            Leave blank and we&apos;ll generate one from your school name instead.
          </p>
        ) : null}
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
          {errorMessage ??
            'Something went wrong sending your request. Please try again or email us directly.'}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={
          status === 'submitting' ||
          subdomainCheck === 'checking' ||
          subdomainCheck === 'unavailable'
        }
      >
        {status === 'submitting' ? 'Sending...' : 'Send request'}
      </Button>
    </form>
  );
}
