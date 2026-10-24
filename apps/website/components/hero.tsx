import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { REPO_URL, DEMO_URL } from '@/lib/constants';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(131,174,217,0.35),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(32,72,108,0.4),transparent)]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-28 sm:items-center sm:text-center">
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          Open source &middot; AGPL-3.0 &middot; self-hosted
        </span>
        <h1 className="font-display text-5xl font-semibold tracking-tight leading-[1.05] sm:text-6xl">
          A school register you run yourself,{' '}
          <span className="bg-linear-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-primary-300 dark:to-primary-500">
            not one you rent.
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          OpenRegistro is a complete electronic register for K-12 schools: roles for staff, students
          and families, a daily class register, a weighted gradebook, and an online
          absence-justification workflow. Install it on your own server or a single container - your
          students&apos; data never leaves your infrastructure.
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:justify-center">
          <Button asChild size="lg">
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Try the live demo
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="/docs">
              Read the docs
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
