import Link from 'next/link';
import { REPO_URL } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm font-semibold text-cream/70 sm:flex-row sm:items-center sm:justify-between">
        <p>OpenRegistro is open source software, licensed under AGPL-3.0.</p>
        <div className="flex items-center gap-6">
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-cream">
            GitHub
          </a>
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cream"
          >
            License
          </a>
          <Link href="/docs" className="hover:text-cream">
            Docs
          </Link>
          <Link href="/host" className="hover:text-cream">
            Free hosting
          </Link>
        </div>
      </div>
      <p
        aria-hidden
        className="select-none overflow-hidden whitespace-nowrap pb-4 text-center font-display font-extrabold leading-none text-cream/10"
        style={{ fontSize: '18vw' }}
      >
        OPENREGISTRO
      </p>
    </footer>
  );
}
