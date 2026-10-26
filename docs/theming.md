# Theming

OpenRegistro ships with one base theme, **Pop Ledger** - the bright, light-only brand used on
the marketing site and in every screenshot. Every school can layer its own accent color on top
of a base theme (set in `/dashboard/school/branding`), and the project welcomes pull requests
that add more base themes to choose from.

## How theme selection works

- A `ThemeDefinition` (`packages/ui/src/themes/types.ts`) is a set of semantic CSS color
  tokens: `background`, `foreground`, `surface`, `surfaceForeground`, `muted`,
  `mutedForeground`, `border`, `ring`, `primary`, `primaryForeground`, `accent`,
  `accentForeground`.
- `packages/ui/src/themes/index.ts` exports a `THEMES` registry (every base theme the app
  knows about) and `themeStyle(themeId, accentColor)`, which resolves a school's chosen theme
  into CSS custom properties and layers an optional per-school accent color override on top of
  just the primary/ring tokens.
- `School.themeId` (`packages/core/src/domain/school.ts`) stores which base theme a school has
  picked; `null` falls back to the default (`DEFAULT_THEME_ID`, currently `pop-ledger`).
- `apps/web`'s dashboard layout and sign-in page both apply `themeStyle(school.themeId,
school.primaryColor)` as an inline style on their root element, so the whole token set -
  not just one color - changes for everyone signed into that school's register.

## Contributing a new base theme

1. Add a new file under `packages/ui/src/themes/`, e.g. `midnight.ts`, exporting a
   `ThemeDefinition` with a stable, kebab-case `id` you will not rename later (it gets stored
   on real school records). Follow `pop-ledger.ts` as the reference for the full token
   contract - every field in `ThemeTokens` is required.
2. Register it in the `THEMES` array in `packages/ui/src/themes/index.ts`. That is the only
   other code change needed - it immediately becomes selectable in every school's branding
   settings.
3. Tokens can be plain hex colors, or reference the shared scales already defined in
   `packages/ui/src/styles/theme.css` (`var(--color-blue-500)`, etc.) if your theme reuses
   part of the existing palette.
4. Keep the pressable hard-shadow, thick-border visual language (see `button.tsx`, `card.tsx`
   in `packages/ui/src/components/`) - a new theme changes the color palette, not the shape
   language, so the rest of the UI (icons, borders, shadows, type) stays consistent across
   themes.
5. Add a screenshot of `/login` and `/dashboard` using your theme to the pull request
   description.
6. Run `pnpm --filter @openregistro/ui test` and `pnpm --filter @openregistro/web build` -
   both must pass with no other files changed.

There is no plan to add per-theme font changes or layout changes - themes are a color
palette choice only, so a school can switch between them without anything else in the app
behaving differently.
