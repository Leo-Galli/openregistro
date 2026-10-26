import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_ID, THEMES, getTheme, popLedgerTheme, themeStyle } from './index';

describe('THEMES registry', () => {
  it('ships exactly the Pop Ledger theme as the default', () => {
    expect(THEMES).toHaveLength(1);
    expect(DEFAULT_THEME_ID).toBe('pop-ledger');
    expect(THEMES[0]).toBe(popLedgerTheme);
  });

  it('getTheme falls back to the default for an unknown or missing id', () => {
    expect(getTheme(null)).toBe(popLedgerTheme);
    expect(getTheme(undefined)).toBe(popLedgerTheme);
    expect(getTheme('does-not-exist')).toBe(popLedgerTheme);
    expect(getTheme('pop-ledger')).toBe(popLedgerTheme);
  });
});

describe('themeStyle', () => {
  it('resolves the full token set for the default theme with no accent override', () => {
    const style = themeStyle(null) as Record<string, string>;
    expect(style['--color-primary']).toBe('var(--color-primary-500)');
    expect(style['--color-background']).toBe('var(--color-cream)');
  });

  it('ignores a missing or malformed accent color override', () => {
    const base = themeStyle('pop-ledger') as Record<string, string>;
    expect(themeStyle('pop-ledger', null)).toMatchObject(base);
    expect(themeStyle('pop-ledger', '')).toMatchObject(base);
    expect(themeStyle('pop-ledger', 'not-a-color')).toMatchObject(base);
    expect(themeStyle('pop-ledger', '#fff')).toMatchObject(base);
  });

  it('overrides the primary and ring tokens with a valid accent color', () => {
    const style = themeStyle('pop-ledger', '#285a87') as Record<string, string>;
    expect(style['--color-primary']).toBe('#285a87');
    expect(style['--color-ring']).toBe('#285a87');
  });

  it('picks a dark foreground for a light accent color', () => {
    const style = themeStyle('pop-ledger', '#f5e9c8') as Record<string, string>;
    expect(style['--color-primary-foreground']).toBe('#15110e');
  });

  it('picks a white foreground for a dark accent color', () => {
    const style = themeStyle('pop-ledger', '#16304a') as Record<string, string>;
    expect(style['--color-primary-foreground']).toBe('#ffffff');
  });
});
