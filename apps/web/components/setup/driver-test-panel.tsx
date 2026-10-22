'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, Button } from '@openregistro/ui';
import { testStorageConnection, type ConnectionTestResult } from '@/app/setup/driver/actions';

export function DriverTestPanel({ driver }: { driver: 'json' | 'postgres' }) {
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runTest() {
    startTransition(async () => {
      const outcome = await testStorageConnection();
      setResult(outcome);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
        <p>
          Detected storage driver: <span className="font-medium">{driver}</span>
        </p>
        <p className="mt-1 text-muted-foreground">
          Set via the <code>STORAGE_DRIVER</code> environment variable. To use the other
          driver, stop the app, change the environment, and restart.
        </p>
      </div>

      <Button type="button" variant="secondary" onClick={runTest} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Test connection
      </Button>

      {result ? (
        <Alert variant={result.ok ? 'success' : 'destructive'}>
          {result.ok ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        {result?.ok ? (
          <Button asChild>
            <Link href="/setup/school">Continue</Link>
          </Button>
        ) : (
          <Button type="button" disabled>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
