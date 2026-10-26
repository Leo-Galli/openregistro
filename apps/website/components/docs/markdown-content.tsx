import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';

/** Rewrites a relative `./other-doc.md` link (as used between docs/*.md files) to its `/docs/other-doc` page. */
function resolveHref(href: string): string {
  const match = /^\.\/([\w-]+)\.md$/.exec(href);
  return match ? `/docs/${match[1]}` : href;
}

const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-12 mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 font-display text-lg font-extrabold text-ink">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-2">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-2">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => {
    const resolved = href ? resolveHref(href) : '#';
    const external = /^https?:\/\//.test(resolved);
    return (
      <a
        href={resolved}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className="font-semibold text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-700"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-extrabold text-ink">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-lg border-l-4 border-primary-500 bg-primary-50 py-2 pl-4 text-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border-2 border-border bg-surface shadow-hard-sm">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b-2 border-border bg-muted">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-t border-border px-4 py-2 align-top">{children}</td>,
  code: ({ className, children }) => {
    const language = /language-(\w+)/.exec(className ?? '')?.[1];
    const text = String(children).replace(/\n$/, '');

    if (language === 'mermaid') {
      return <MermaidDiagram chart={text} />;
    }

    if (className) {
      // Fenced code block (has a language class) - rendered as a full block by the `pre` override below.
      return <code className="font-mono text-sm text-neutral-100">{text}</code>;
    }

    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl bg-neutral-900 p-4 shadow-hard-sm">
      {children}
    </pre>
  ),
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
