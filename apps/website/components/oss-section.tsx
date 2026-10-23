import { Scale, Heart, GitPullRequest } from 'lucide-react';
import { Button } from '@openregistro/ui';

const REPO_URL = 'https://github.com/Leo-Galli/openregistro';

export function OssSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div>
          <h2 className="font-display text-3xl font-semibold">Open source, on purpose</h2>
          <p className="mt-4 text-muted-foreground">
            OpenRegistro is licensed under AGPL-3.0. For server-side software that schools
            self-host, AGPL closes the usual &quot;SaaS loophole&quot; of a plain permissive or
            weak-copyleft license: if someone runs a modified version of OpenRegistro as a network
            service, they must release the source of that version to the people using it. A vendor
            can&apos;t take this project, fork it into a closed hosted product, and stop
            contributing back.
          </p>
          <p className="mt-4 text-muted-foreground">
            That also means you keep every right a school needs: read the code that handles your
            students&apos; data, run it anywhere, and modify it to fit your own policies.
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </span>
            <span className="font-medium">AGPL-3.0 licensed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitPullRequest className="h-5 w-5" />
            </span>
            <span className="font-medium">Contributions welcome</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </span>
            <span className="font-medium">No per-student fees, ever</span>
          </div>
          <Button asChild variant="outline" className="mt-2">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Browse the repository
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
