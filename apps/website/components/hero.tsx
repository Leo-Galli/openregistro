import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import { Button } from '@openregistro/ui';

const REPO_URL = 'https://github.com/Leo-Galli/openregistro';
const DEMO_URL = 'https://openregistro-demo.vercel.app';

export function Hero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-24 sm:items-center sm:text-center">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
        Open source - AGPL-3.0 - self-hosted
      </span>
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
        A school register you run yourself, not one you rent.
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
        <Button asChild size="lg" variant="outline">
          <a href="/docs">
            Read the docs
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}
