const JSON_DRIVER_COMMANDS = ['pnpm install', 'pnpm dev:json'];
const DOCKER_COMMAND = 'docker compose up';

function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-5 font-mono text-sm text-neutral-100 shadow-raised">
      <code>
        {lines.map((line) => (
          <div key={line}>
            <span className="select-none text-neutral-500">$ </span>
            {line}
          </div>
        ))}
      </code>
    </pre>
  );
}

export function InstallSection() {
  return (
    <section id="install" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Install in minutes</h2>
          <p className="mt-3 text-muted-foreground">
            No database required to try it out - the JSON driver stores everything as plain files on
            disk.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 font-medium">Run locally, no database</h3>
            <CodeBlock lines={JSON_DRIVER_COMMANDS} />
          </div>
          <div>
            <h3 className="mb-3 font-medium">Production-like stack with PostgreSQL</h3>
            <CodeBlock lines={[DOCKER_COMMAND]} />
          </div>
        </div>
      </div>
    </section>
  );
}
