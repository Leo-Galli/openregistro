import type { Metadata } from 'next';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@openregistro/ui';

const REPO_URL = 'https://github.com/Leo-Galli/openregistro';

export const metadata: Metadata = {
  title: 'Documentation - OpenRegistro',
  description: 'Quick start and documentation links for self-hosting OpenRegistro.',
};

const STEPS = [
  {
    text: 'Clone the repository',
    command: `git clone ${REPO_URL}.git`,
  },
  { text: 'Install dependencies', command: 'pnpm install' },
  { text: 'Start it with no database required', command: 'pnpm dev:json' },
  { text: 'Or run the full stack with PostgreSQL', command: 'docker compose up' },
];

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Documentation</h1>
      <p className="mt-4 text-muted-foreground">
        The full installation, configuration, architecture and API reference docs live in the
        project repository and are kept in sync with the code.
      </p>

      <h2 className="mt-12 mb-4 font-display text-xl font-semibold tracking-tight">Quick start</h2>
      <div className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <div
            key={step.command}
            className="flex flex-col gap-3 rounded-xl border-2 border-border bg-surface p-4 shadow-hard-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-primary-300 text-sm font-extrabold text-ink">
              {index + 1}
            </span>
            <p className="text-sm font-medium">{step.text}</p>
            <code className="ml-auto overflow-x-auto rounded-lg bg-neutral-900 px-3 py-1.5 font-mono text-xs text-neutral-100">
              {step.command}
            </code>
          </div>
        ))}
        <div className="flex items-center gap-4 rounded-xl border-2 border-border bg-surface p-4 shadow-hard-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-primary-300 text-sm font-extrabold text-ink">
            5
          </span>
          <p className="text-sm font-medium">
            Open the app in your browser and follow the first-run setup wizard.
          </p>
        </div>
      </div>

      <Card className="mt-12">
        <CardHeader>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-primary-300 text-ink">
            <BookOpen className="h-5 w-5" />
          </span>
          <CardTitle className="mt-3">Full documentation</CardTitle>
          <CardDescription>
            Installation, configuration reference, architecture overview, and the API reference are
            maintained as part of the repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={`${REPO_URL}/tree/main/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Browse the docs folder on GitHub
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </section>
  );
}
