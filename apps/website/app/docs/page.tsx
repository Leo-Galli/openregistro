import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconBadge,
} from '@openregistro/ui';
import { DEMO_URL, REPO_URL } from '@/lib/constants';
import { DOC_CATEGORIES, DOCS, getDocsByCategory } from '@/lib/docs';

export const metadata: Metadata = {
  title: 'Documentation - OpenRegistro',
  description:
    'Complete OpenRegistro docs: installation, configuration, architecture, theming, backups, GDPR, and server actions.',
};

const STEPS = [
  { text: 'Clone the repository', command: `git clone ${REPO_URL}.git` },
  { text: 'Install dependencies', command: 'pnpm install' },
  { text: 'Start it with no database required', command: 'pnpm dev:json' },
  { text: 'Or run the full stack with PostgreSQL', command: 'docker compose up' },
];

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-blue-600">Docs</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Everything you need to run OpenRegistro
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Installation, configuration, architecture, theming, backups, GDPR, and the server-actions
          reference - rendered here straight from the repository&apos;s <code>docs/</code> folder.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Guides</CardDescription>
            <CardTitle className="font-ui text-3xl tabular-nums">{DOCS.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Live demo</CardDescription>
            <CardTitle className="text-lg">
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 underline decoration-2 underline-offset-2"
              >
                Try it
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Source of truth</CardDescription>
            <CardTitle className="text-lg">
              <a
                href={`${REPO_URL}/tree/main/docs`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 underline decoration-2 underline-offset-2"
              >
                docs/ on GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Documentation index" className="flex flex-col gap-6">
            {DOC_CATEGORIES.map((category) => (
              <div key={category.id}>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  {category.title}
                </p>
                <ul className="flex flex-col gap-1">
                  {getDocsByCategory(category.id).map((doc) => (
                    <li key={doc.slug}>
                      <Link
                        href={`/docs/${doc.slug}`}
                        className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-ink/80 transition-colors hover:bg-primary-100 hover:text-ink"
                      >
                        {doc.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex flex-col gap-14">
          <div>
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
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
          </div>

          {DOC_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
                {category.title}
              </h2>
              <p className="mt-2 mb-5 text-muted-foreground">{category.description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {getDocsByCategory(category.id).map((doc) => (
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
            </div>
          ))}

          <Card>
            <CardHeader>
              <IconBadge>
                <BookOpen className="h-5 w-5" />
              </IconBadge>
              <CardTitle className="mt-3">Prefer GitHub?</CardTitle>
              <CardDescription>
                Every page above is rendered directly from the markdown files in the
                repository&apos;s <code>docs/</code> folder - browse or edit them there instead.
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
        </div>
      </div>
    </section>
  );
}
