'use client';

import { useState } from 'react';
import { Check, Copy, Key } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { generateLicenseAction } from '@/app/cp/actions';

export function LicenseCell({ id, licenseKey }: { id: string; licenseKey: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!licenseKey) {
    return (
      <form action={generateLicenseAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="outline">
          <Key className="h-3.5 w-3.5" />
          Generate license
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg border border-border bg-muted px-2 py-1 text-xs">
        {licenseKey}
      </code>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(licenseKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
