import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
}

/**
 * The single source of truth for which docs/*.md files become pages here,
 * in display order. Keep this in sync with the repository's docs/ folder -
 * there is no filesystem scan, so a new doc file needs an entry here to show
 * up on the site.
 */
export const DOCS: DocEntry[] = [
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Self-hosting from scratch with Docker or Node, both storage drivers.',
  },
  {
    slug: 'configuration',
    title: 'Configuration',
    description: 'Environment variables and what the setup wizard asks for.',
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    description: 'Monorepo layout, the StorageDriver abstraction, RBAC, and request flow.',
  },
  {
    slug: 'theming',
    title: 'Theming',
    description: 'The base theme system and how to contribute a new one.',
  },
  {
    slug: 'backups',
    title: 'Backups',
    description: 'Backing up and restoring both storage drivers.',
  },
  {
    slug: 'gdpr',
    title: 'GDPR / data protection',
    description: 'What personal data is stored, and how to export or erase it.',
  },
  {
    slug: 'api-reference',
    title: 'Server actions reference',
    description: 'Every mutating server action, grouped by feature area.',
  },
];

/**
 * docs/*.md lives at the repository root, two levels above this app - Next.js
 * runs this at build time with process.cwd() set to apps/website, so this
 * resolves the same way in dev, in `next build`, and in CI regardless of
 * where the command was invoked from.
 */
const DOCS_DIR = path.join(process.cwd(), '..', '..', 'docs');

export function getDoc(slug: string): DocEntry | undefined {
  return DOCS.find((doc) => doc.slug === slug);
}

/**
 * Reads one docs/<slug>.md file and splits off its leading "# Title" line -
 * the page renders that as a styled <h1> itself, so the markdown body below
 * doesn't repeat it as a second, redundant heading.
 */
export async function getDocContent(slug: string): Promise<{ title: string; body: string }> {
  const raw = await readFile(path.join(DOCS_DIR, `${slug}.md`), 'utf-8');
  const match = /^#\s+(.+)\n+([\s\S]*)$/.exec(raw);
  if (!match) return { title: slug, body: raw };
  const [, title, body] = match;
  return { title: (title ?? slug).trim(), body: body ?? '' };
}
