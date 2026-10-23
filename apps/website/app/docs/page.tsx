import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

const REPO_URL = 'https://github.com/Leo-Galli/openregistro';

export const metadata: Metadata = {
  title: 'Documentation - OpenRegistro',
  description: 'Quick start and documentation links for self-hosting OpenRegistro.',
};

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-3xl font-semibold">Documentation</h1>
      <p className="mt-4 text-muted-foreground">
        The full installation, configuration, architecture and API reference docs live in the
        project repository and are kept in sync with the code.
      </p>

      <h2 className="mt-10 font-display text-xl font-semibold">Quick start</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
        <li>
          Clone the repository:{' '}
          <code className="font-mono text-foreground">git clone {REPO_URL}.git</code>
        </li>
        <li>
          Install dependencies: <code className="font-mono text-foreground">pnpm install</code>
        </li>
        <li>
          Start it with no database required:{' '}
          <code className="font-mono text-foreground">pnpm dev:json</code>
        </li>
        <li>
          Or run the full stack with PostgreSQL:{' '}
          <code className="font-mono text-foreground">docker compose up</code>
        </li>
        <li>Open the app in your browser and follow the first-run setup wizard.</li>
      </ol>

      <h2 className="mt-10 font-display text-xl font-semibold">Full documentation</h2>
      <p className="mt-4 text-muted-foreground">
        Installation, configuration reference, architecture overview, and the API reference are
        maintained as part of the repository.
      </p>
      <a
        href={`${REPO_URL}/tree/main/docs`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        Browse the docs folder on GitHub
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </section>
  );
}
