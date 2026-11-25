import { Button } from '@openregistro/ui';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demo';

export function DemoQuickLogin() {
  return (
    <div className="mt-6 rounded-xl border-2 border-border bg-muted/40 p-4 shadow-hard-sm">
      <p className="text-sm font-semibold text-ink">Public demo accounts</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Password for every account: <code className="font-mono">{DEMO_PASSWORD}</code>. Changes are
        not saved.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {Object.values(DEMO_ACCOUNTS).map((account) => (
          <Button key={account.key} asChild variant="outline" size="sm" className="justify-between">
            <a href={`/api/demo/login?as=${account.key}`}>
              <span>{account.role}</span>
              <span className="font-mono text-xs text-muted-foreground">{account.email}</span>
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
