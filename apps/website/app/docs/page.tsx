import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconBadge,
} from '@openregistro/ui';
import { REPO_URL } from '@/lib/constants';
import { DOCS } from '@/lib/docs';

export const metadata: Metadata = {
  title: 'Documentation - OpenRegistro',
  description: 'Installation, configuration, architecture, theming, backups, and GDPR docs.',
};

const STEPS = [
  { text: 'Clone the repository', command: `git clone ${REPO_URL}.git` },
  { text: 'Install dependencies', command: 'pnpm install' },
  { text: 'Start it with no database required', command: 'pnpm dev:json' },
  { text: 'Or run the full stack with PostgreSQL', command: 'docker compose up' },
];

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
        Documentation
      </h1>
      <p className="mt-4 text-muted-foreground">
        Installation, configuration, architecture, theming, backups, and GDPR docs - rendered here
        straight from the repository&apos;s <code>docs/</code> folder, kept in sync with the code.
      </p>

      <h2 className="mt-12 mb-4 font-display text-xl font-extrabold tracking-tight text-ink">
        Quick start
      </h2>
      <div className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <div
            key={step.command}
            className="flex flex-col gap-3 rounded-xl border-2 border-border bg-surface p-4 shadow-hard-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <IconBadge size="sm" shape="circle" className="text-sm font-extrabold">
              {index + 1}
            </IconBadge>
            <p className="text-sm font-medium">{step.text}</p>
            <code className="ml-auto overflow-x-auto rounded-lg bg-neutral-900 px-3 py-1.5 font-mono text-xs text-neutral-100">
              {step.command}
            </code>
          </div>
        ))}
        <div className="flex items-center gap-4 rounded-xl border-2 border-border bg-surface p-4 shadow-hard-sm">
          <IconBadge size="sm" shape="circle" className="text-sm font-extrabold">
            5
          </IconBadge>
          <p className="text-sm font-medium">
            Open the app in your browser and follow the first-run setup wizard.
          </p>
        </div>
      </div>

      <h2 className="mt-12 mb-4 font-display text-xl font-extrabold tracking-tight text-ink">
        Guides
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <Link key={doc.slug} href={`/docs/${doc.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-hard">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {doc.title}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-12">
        <CardHeader>
          <IconBadge>
            <BookOpen className="h-5 w-5" />
          </IconBadge>
          <CardTitle className="mt-3">Prefer GitHub?</CardTitle>
          <CardDescription>
            Every page above is rendered directly from the markdown files in the repository&apos;s
            <code> docs/</code> folder - browse or edit them there instead.
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
            <ArrowRight className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </section>
  );
}
