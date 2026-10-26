import type { CSSProperties } from 'react';
import { popLedgerTheme } from './pop-ledger';
import type { ThemeDefinition } from './types';

export type { ThemeDefinition, ThemeTokens } from './types';
export { popLedgerTheme } from './pop-ledger';

export const DEFAULT_THEME_ID = popLedgerTheme.id;

/**
 * Every base theme shipped with OpenRegistro. Contributing a new one is a
 * two-step pull request: add a ThemeDefinition file next to pop-ledger.ts
 * (same token contract) and register it here - it then shows up for every
 * school in branding settings with no other code changes. See
 * docs/theming.md for the full contribution guide.
 */
export const THEMES: ThemeDefinition[] = [popLedgerTheme];

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? popLedgerTheme;
}

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

/** WCAG relative luminance, used to pick a readable foreground for an arbitrary accent color. */
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
 * Resolves a school's chosen base theme (falling back to the default) into
 * CSS custom properties, then layers an optional per-school accent color
 * override on top of just the primary/ring tokens - the school's own brand
 * color always wins over whatever the chosen theme's primary is.
 */
export function themeStyle(
  themeId: string | null | undefined,
  accentColor?: string | null,
): CSSProperties {
  const theme = getTheme(themeId);
  const style: Record<string, string> = {
    '--color-background': theme.tokens.background,
    '--color-foreground': theme.tokens.foreground,
    '--color-surface': theme.tokens.surface,
    '--color-surface-foreground': theme.tokens.surfaceForeground,
    '--color-muted': theme.tokens.muted,
    '--color-muted-foreground': theme.tokens.mutedForeground,
    '--color-border': theme.tokens.border,
    '--color-ring': theme.tokens.ring,
    '--color-primary': theme.tokens.primary,
    '--color-primary-foreground': theme.tokens.primaryForeground,
    '--color-accent': theme.tokens.accent,
    '--color-accent-foreground': theme.tokens.accentForeground,
  };

  const match = accentColor ? HEX_PATTERN.exec(accentColor) : null;
  const hex = match?.[1];
  if (hex) {
    const color = `#${hex}`;
    style['--color-primary'] = color;
    style['--color-primary-foreground'] = contrastForeground(hex);
    style['--color-ring'] = color;
  }

  return style as CSSProperties;
}
