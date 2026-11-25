import { describe, expect, it } from 'vitest';
import { normalizeDirectoryBaseUrl } from './directory-schools';

describe('normalizeDirectoryBaseUrl', () => {
  it('adds https and strips trailing slashes and paths', () => {
    expect(normalizeDirectoryBaseUrl('registro.example.it/')).toBe('https://registro.example.it');
    expect(normalizeDirectoryBaseUrl('https://a.example.com/login')).toBe('https://a.example.com');
  });

  it('keeps http when explicitly provided', () => {
    expect(normalizeDirectoryBaseUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });
});
