/**
 * The full set of semantic color tokens a base theme must define. Every
 * value is a valid CSS color (a hex code, or a `var(--color-*)` reference
 * into the shared yellow/blue/pink/neutral scales from theme.css).
 */
export interface ThemeTokens {
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
}

export interface ThemeDefinition {
  /** Stable identifier stored on a school record - never rename once shipped. */
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
}
