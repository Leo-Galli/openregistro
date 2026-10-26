import type { ThemeDefinition } from './types';

/**
 * The default OpenRegistro brand and the only theme shipped today - sunny
 * yellow and cobalt blue on a warm cream background, thick ink-navy borders,
 * hard offset shadows. These values are the exact runtime-overridable subset
 * of the :root tokens in styles/theme.css, so selecting this theme explicitly
 * changes nothing visually from the system default.
 */
export const popLedgerTheme: ThemeDefinition = {
  id: 'pop-ledger',
  name: 'Pop Ledger',
  description:
    'The OpenRegistro default: sunny yellow and cobalt blue on a warm cream background, with thick ink-navy borders and hard offset shadows. Matches the marketing site.',
  tokens: {
    background: 'var(--color-cream)',
    foreground: 'var(--color-ink)',
    surface: '#ffffff',
    surfaceForeground: 'var(--color-ink)',
    muted: 'var(--color-primary-50)',
    mutedForeground: '#5a5f72',
    border: 'var(--color-ink)',
    ring: 'var(--color-blue-500)',
    primary: 'var(--color-primary-500)',
    primaryForeground: 'var(--color-ink)',
    accent: 'var(--color-blue-50)',
    accentForeground: 'var(--color-ink)',
  },
};
