import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DOCS, getDoc, getDocContent } from '@/lib/docs';
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

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/docs"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All docs
      </Link>

      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink">{title}</h1>

      <div className="mt-8">
        <MarkdownContent content={body} />
      </div>

      <p className="mt-12 border-t-2 border-border pt-6 text-sm text-muted-foreground">
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
    </section>
  );
}
