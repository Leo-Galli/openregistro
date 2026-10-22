import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';
import { WizardShell } from '@/components/setup/wizard-shell';
import { getEnv } from '@/lib/env';
import { getStorage } from '@/lib/storage';

const MIN_NODE_MAJOR = 20;

function nodeVersionOk(): boolean {
  const major = Number(process.versions.node.split('.')[0]);
  return major >= MIN_NODE_MAJOR;
}

async function storageReachable(): Promise<boolean> {
  try {
    const storage = await getStorage();
    return await storage.healthCheck();
  } catch {
    return false;
  }
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
      )}
      <span>{label}</span>
    </li>
  );
}

export default async function WelcomePage() {
  const env = getEnv();
  const nodeOk = nodeVersionOk();
  const storageOk = await storageReachable();
  const allOk = nodeOk && storageOk;

  return (
    <WizardShell activeSlug="welcome">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to OpenRegistro</CardTitle>
          <CardDescription>
            Let&apos;s set up your school&apos;s register. This takes about five minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ul className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-4">
            <CheckRow ok={nodeOk} label={`Node.js ${process.versions.node} (requires ${MIN_NODE_MAJOR}+)`} />
            <CheckRow
              ok={storageOk}
              label={`Storage driver "${env.STORAGE_DRIVER}" is reachable`}
            />
          </ul>
          {!allOk ? (
            <p className="text-sm text-destructive">
              Fix the failing requirement above, then reload this page.
            </p>
          ) : null}
          <div className="flex justify-end">
            {allOk ? (
              <Button asChild>
                <Link href="/setup/driver">Continue</Link>
              </Button>
            ) : (
              <Button type="button" disabled>
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </WizardShell>
  );
}
