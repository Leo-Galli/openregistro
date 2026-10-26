import type { ReactNode } from 'react';
import { cn } from '@openregistro/ui';
import { WIZARD_STEPS } from './wizard-steps';

export function WizardShell({ activeSlug, children }: { activeSlug: string; children: ReactNode }) {
  const activeIndex = WIZARD_STEPS.findIndex((step) => step.slug === activeSlug);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-display text-2xl font-extrabold text-foreground">OpenRegistro setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This wizard runs once. It cannot be reopened after the final step.
        </p>
      </div>
      <ol className="mb-8 flex items-center justify-between gap-1" aria-label="Setup steps">
        {WIZARD_STEPS.map((step, index) => (
          <li key={step.slug} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold',
                index < activeIndex && 'bg-success text-success-foreground',
                index === activeIndex && 'bg-primary text-primary-foreground',
                index > activeIndex && 'bg-muted text-muted-foreground',
              )}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              {index + 1}
            </span>
            <span className="text-center text-xs text-muted-foreground">{step.label}</span>
          </li>
        ))}
      </ol>
      {children}
    </div>
  );
}
