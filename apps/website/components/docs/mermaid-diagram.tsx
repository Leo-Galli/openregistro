'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Lazily loads mermaid only when a page actually has a diagram to render -
 * this keeps every other static, zero-JS doc page from paying for a library
 * only two diagrams (today, both in architecture.md) actually use.
 *
 * dangerouslySetInnerHTML here is safe: `chart` is always a hardcoded string
 * from this repository's own docs/*.md files, resolved at build/request time
 * on the server and passed down as a prop - never user input - and mermaid's
 * own rendered SVG output is what gets injected, not the raw chart text.
 */
let initialized = false;

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid');
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              primaryColor: '#ffcd29',
              primaryBorderColor: '#151b32',
              primaryTextColor: '#151b32',
              lineColor: '#151b32',
              fontFamily: 'var(--font-ui)',
            },
          });
          initialized = true;
        }
        const result = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(result.svg);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-4 text-sm text-neutral-100">
        {chart}
      </pre>
    );
  }

  return (
    <div className="my-6 min-h-16 overflow-x-auto rounded-xl border-2 border-border bg-surface p-6 shadow-hard-sm [&_svg]:mx-auto">
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    </div>
  );
}
