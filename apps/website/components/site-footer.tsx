import Link from 'next/link';
import { REPO_URL } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>OpenRegistro is open source software, licensed under AGPL-3.0.</p>
        <div className="flex items-center gap-6">
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            License
          </a>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/host" className="hover:text-foreground">
            Free hosting
          </Link>
        </div>
      </div>
    </footer>
  );
}
