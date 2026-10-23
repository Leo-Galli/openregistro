import { describe, expect, it } from 'vitest';
import { brandColorStyle } from './brand-color';

describe('brandColorStyle', () => {
  it('returns undefined for null, undefined, or an empty string', () => {
    expect(brandColorStyle(null)).toBeUndefined();
    expect(brandColorStyle(undefined)).toBeUndefined();
    expect(brandColorStyle('')).toBeUndefined();
  });

  it('returns undefined for a malformed hex color', () => {
    expect(brandColorStyle('not-a-color')).toBeUndefined();
    expect(brandColorStyle('#fff')).toBeUndefined();
    expect(brandColorStyle('285a87')).toBeUndefined();
  });

  it('overrides the primary and ring tokens with the given color', () => {
    const style = brandColorStyle('#285a87');
    expect(style).toMatchObject({
      '--color-primary': '#285a87',
      '--color-ring': '#285a87',
    });
  });

  it('picks a dark foreground for a light brand color', () => {
    const style = brandColorStyle('#f5e9c8') as Record<string, string>;
    expect(style['--color-primary-foreground']).toBe('#15110e');
  });

  it('picks a white foreground for a dark brand color', () => {
    const style = brandColorStyle('#16304a') as Record<string, string>;
    expect(style['--color-primary-foreground']).toBe('#ffffff');
  });
});
