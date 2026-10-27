import { randomBytes } from 'node:crypto';

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Turns a school name into a DNS-label-safe slug: lowercase ascii
 * alphanumerics and hyphens only, no leading/trailing/doubled hyphens,
 * capped well under the 63-char DNS label limit for readability.
 */
function slugify(schoolName: string): string {
  const base = schoolName
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '');
  return base || 'school';
}

/**
 * Names that would collide with real infrastructure subdomains, or be
 * confusing/misleading as a school's own address, if a visitor were allowed
 * to claim them for themselves.
 */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'demo',
  'admin',
  'cp',
  'app',
  'mail',
  'smtp',
  'ftp',
  'docs',
  'status',
  'blog',
  'openregistro',
]);

const SUBDOMAIN_FORMAT = /^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$/;

export interface SubdomainFormatError {
  code: 'too_short' | 'too_long' | 'invalid_format' | 'reserved';
  message: string;
}

/**
 * Validates a visitor-chosen subdomain - lowercase letters, digits, and
 * hyphens only, no leading/trailing hyphen, 3-30 characters, and not one of
 * the names this platform's own infrastructure already uses. Pure format
 * check only; availability (is it already taken by another school) is a
 * separate, async check against the database.
 */
export function validateSubdomainFormat(subdomain: string): SubdomainFormatError | null {
  if (subdomain.length < 3) {
    return { code: 'too_short', message: 'Must be at least 3 characters.' };
  }
  if (subdomain.length > 30) {
    return { code: 'too_long', message: 'Must be 30 characters or fewer.' };
  }
  if (!SUBDOMAIN_FORMAT.test(subdomain)) {
    return {
      code: 'invalid_format',
      message: 'Use only lowercase letters, numbers, and hyphens - no leading or trailing hyphen.',
    };
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { code: 'reserved', message: 'This subdomain is reserved.' };
  }
  return null;
}

const MAX_ATTEMPTS = 20;

/**
 * Generates a unique subdomain slug for a newly activated hosting request -
 * the school's eventual <slug>.openregistro.another-horizon.eu address.
 * Tries the plain slugified school name first, then appends a short random
 * suffix on collision. Bounded retries rather than an infinite loop: a
 * practically unreachable number of schools would need the exact same name
 * for this to ever run out. Takes the uniqueness check as a parameter
 * (rather than importing @openregistro/db's isSubdomainTaken directly) so
 * the slug logic itself stays pure and testable without a database.
 */
export async function generateUniqueSubdomain(
  schoolName: string,
  isTaken: (subdomain: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(schoolName);

  if (!(await isTaken(base))) {
    return base;
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = `${base}-${randomBytes(2).toString('hex')}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error(`Could not generate a unique subdomain for "${schoolName}".`);
}
