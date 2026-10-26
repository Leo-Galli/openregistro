import { describe, expect, it } from 'vitest';
import { generateUniqueSubdomain } from './subdomain-slug';

const neverTaken = async () => false;

describe('generateUniqueSubdomain', () => {
  it('slugifies the school name to lowercase, hyphenated ascii', async () => {
    const subdomain = await generateUniqueSubdomain('Liceo "Léon Foucault"', neverTaken);
    expect(subdomain).toBe('liceo-leon-foucault');
  });

  it('caps the slug length well under the 63-char DNS label limit', async () => {
    const subdomain = await generateUniqueSubdomain(
      'Istituto Comprensivo Statale Giovanni Falcone e Paolo Borsellino',
      neverTaken,
    );
    expect(subdomain.length).toBeLessThanOrEqual(30);
    expect(subdomain.endsWith('-')).toBe(false);
  });

  it('falls back to "school" for a name with no ascii alphanumerics', async () => {
    const subdomain = await generateUniqueSubdomain('°°°', neverTaken);
    expect(subdomain).toBe('school');
  });

  it('appends a random suffix when the base slug is taken', async () => {
    const taken = new Set(['liceo-galilei']);
    const isTaken = async (candidate: string) => taken.has(candidate);

    const subdomain = await generateUniqueSubdomain('Liceo Galilei', isTaken);

    expect(subdomain).not.toBe('liceo-galilei');
    expect(subdomain.startsWith('liceo-galilei-')).toBe(true);
  });

  it('throws if every candidate is somehow already taken', async () => {
    await expect(generateUniqueSubdomain('Liceo Galilei', async () => true)).rejects.toThrow(
      /Could not generate a unique subdomain/,
    );
  });
});
