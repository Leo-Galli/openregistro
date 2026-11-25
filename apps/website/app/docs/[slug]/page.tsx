import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DOC_CATEGORIES, DOCS, getDoc, getDocContent, getDocsByCategory } from '@/lib/docs';
import { MarkdownContent } from '@/components/docs/markdown-content';
import { REPO_URL } from '@/lib/constants';

export function generateStaticParams() {
  return DOCS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} - OpenRegistro Docs`,
    description: doc.description,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const { title, body } = await getDocContent(slug);
  const index = DOCS.findIndex((entry) => entry.slug === slug);
  const previous = index > 0 ? DOCS[index - 1] : undefined;
  const next = index >= 0 && index < DOCS.length - 1 ? DOCS[index + 1] : undefined;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Link
            href="/docs"
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All docs
          </Link>
          <nav aria-label="Documentation" className="flex flex-col gap-6">
            {DOC_CATEGORIES.map((category) => (
              <div key={category.id}>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  {category.title}
                </p>
                <ul className="flex flex-col gap-1">
                  {getDocsByCategory(category.id).map((entry) => {
                    const active = entry.slug === slug;
                    return (
                      <li key={entry.slug}>
                        <Link
                          href={`/docs/${entry.slug}`}
                          aria-current={active ? 'page' : undefined}
                          className={
                            active
                              ? 'block rounded-lg border-2 border-border bg-primary-100 px-2 py-1.5 text-sm font-extrabold text-ink shadow-hard-sm'
                              : 'block rounded-lg px-2 py-1.5 text-sm font-semibold text-ink/80 transition-colors hover:bg-primary-100 hover:text-ink'
                          }
                        >
                          {entry.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <article>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-600">
            {DOC_CATEGORIES.find((category) => category.id === doc.category)?.title}
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-muted-foreground">{doc.description}</p>

          <div className="mt-8">
            <MarkdownContent content={body} />
          </div>

          <div className="mt-12 grid gap-4 border-t-2 border-border pt-6 sm:grid-cols-2">
            {previous ? (
              <Link
                href={`/docs/${previous.slug}`}
                className="rounded-xl border-2 border-border bg-surface p-4 shadow-hard-sm transition-shadow hover:shadow-hard"
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Previous
                </p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-ink">
                  <ArrowLeft className="h-4 w-4" />
                  {previous.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/docs/${next.slug}`}
                className="rounded-xl border-2 border-border bg-surface p-4 text-right shadow-hard-sm transition-shadow hover:shadow-hard sm:justify-self-end"
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Next
                </p>
                <p className="mt-1 inline-flex items-center justify-end gap-1 font-semibold text-ink">
                  {next.title}
                  <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ) : null}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Found an issue with this page?{' '}
            <a
              href={`${REPO_URL}/edit/main/docs/${slug}.md`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-600 underline hover:text-blue-700"
            >
              Edit it on GitHub
            </a>
            .
          </p>
        </article>
      </div>
    </section>
  );
}
