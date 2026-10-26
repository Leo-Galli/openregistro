import Link from 'next/link';
import { BookOpen, Github } from 'lucide-react';
import { Button } from '@openregistro/ui';
import { REPO_URL } from '@/lib/constants';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#install', label: 'Install' },
  { href: '/host', label: 'Free hosting' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/docs', label: 'Docs' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-[84px] items-center border-b-2 border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-primary-400">
            <BookOpen className="h-5 w-5" />
          </span>
          OpenRegistro
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-ink/70 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/host">Get free hosting</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
