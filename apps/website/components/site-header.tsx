import Link from 'next/link';
import { Github } from 'lucide-react';
import { Button } from '@openregistro/ui';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#install', label: 'Install' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/docs', label: 'Docs' },
];

const REPO_URL = 'https://github.com/Leo-Galli/openregistro';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          OpenRegistro
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="outline" size="sm">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}
