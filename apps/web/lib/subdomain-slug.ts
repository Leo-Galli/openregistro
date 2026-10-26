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
