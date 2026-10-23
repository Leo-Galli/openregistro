import type { CSSProperties } from 'react';

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

/**
 * WCAG relative luminance, used to pick a readable foreground (black or
 * white) for an arbitrary school-chosen brand color used as a button/badge
 * background.
 */
function channelToLinear(hex: string, offset: number): number {
  const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  return (
    0.2126 * channelToLinear(hex, 0) +
    0.7152 * channelToLinear(hex, 2) +
    0.0722 * channelToLinear(hex, 4)
  );
}

function contrastForeground(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#15110e' : '#ffffff';
}

/**
 * Overrides the design system's `--color-primary` token (and everything
 * derived from it - buttons, links, focus rings) with a school's own brand
 * color, scoped to whatever element this style is applied to. Returns
 * undefined for an invalid/missing color so callers can spread it safely.
 */
export function brandColorStyle(
  primaryColor: string | null | undefined,
): CSSProperties | undefined {
  const match = primaryColor ? HEX_PATTERN.exec(primaryColor) : null;
  const hex = match?.[1];
  if (!hex) return undefined;
  const color = `#${hex}`;

  return {
    '--color-primary': color,
    '--color-primary-foreground': contrastForeground(hex),
    '--color-ring': color,
  } as CSSProperties;
}
