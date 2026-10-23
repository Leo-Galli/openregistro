import { describe, expect, it } from 'vitest';
import { normalizeTimestamps } from './repository-factory';

describe('normalizeTimestamps', () => {
  it('converts Postgres timestamptz text output to strict ISO 8601', () => {
    const row = { createdAt: '2026-10-23 15:05:36.832+00', name: 'Demo' };
    expect(normalizeTimestamps(row).createdAt).toBe('2026-10-23T15:05:36.832+00:00');
  });

  it('expands a short two-digit offset to a full HH:MM offset', () => {
    expect(normalizeTimestamps({ t: '2026-01-01 00:00:00+02' }).t).toBe(
      '2026-01-01T00:00:00+02:00',
    );
  });

  it('defaults to Z when Postgres omits an offset entirely', () => {
    expect(normalizeTimestamps({ t: '2026-01-01 00:00:00' }).t).toBe('2026-01-01T00:00:00Z');
  });

  it('leaves an already-strict ISO 8601 string untouched', () => {
    const iso = '2026-10-23T15:05:36.832Z';
    expect(normalizeTimestamps({ t: iso }).t).toBe(iso);
  });

  it('leaves unrelated string fields untouched', () => {
    expect(normalizeTimestamps({ name: 'Via Esempio 1, 00100 Roma' }).name).toBe(
      'Via Esempio 1, 00100 Roma',
    );
  });

  it('passes through null and non-object values unchanged', () => {
    expect(normalizeTimestamps(null)).toBeNull();
    expect(normalizeTimestamps(undefined)).toBeUndefined();
  });
});
