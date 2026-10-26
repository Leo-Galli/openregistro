import { ArrowRight, Server } from 'lucide-react';
import { Button, IconBadge } from '@openregistro/ui';

export function HostingCtaSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-surface px-8 py-14 shadow-hard sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <IconBadge size="xl">
                <Server className="h-6 w-6" />
              </IconBadge>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Don&apos;t want to run a server? We&apos;ll host it for you - free.
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Your own dedicated instance and database, set up for you at no cost. No fee, no
                  approval step.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <a href="/host">
                Get free hosting
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
