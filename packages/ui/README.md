# @openregistro/ui

OpenRegistro's design system: tokens, a Tailwind v4 theme, and a shared component
library built on Radix primitives.

## Principles

- **Not a template.** No purple/indigo gradients, no glassmorphism, no stock
  illustration, no generic AI-template look. The product is a daily work tool for
  teachers and administrators, not a marketing demo.
- **Dense but readable.** Tables are the primary surface; typography and spacing are
  tuned for scanning rows of grades and attendance quickly, not for marketing hero
  sections.
- **Accessible by construction.** Every interactive component wraps a Radix primitive,
  so focus management, keyboard navigation, and ARIA attributes are correct by
  default. Custom styling never removes the visible focus ring.
- **One palette, two themes.** Light and dark are defined together as CSS custom
  properties (`src/styles/theme.css`), not as an afterthought bolted onto a
  light-only palette.

## Palette: "Harbor"

- **Primary** - a confident ink/harbor blue (`--color-primary-50` through `-950`),
  used for primary actions, active navigation, and focus rings. Deliberately not a
  generic indigo/violet.
- **Neutral** - a warm stone scale (slight amber undertone rather than cold slate),
  used for backgrounds, borders, and body text.
- **Semantic** - success (green), warning (amber), destructive (red), each with a
  `-foreground` pair for guaranteed contrast.

## Typography

- **Display** (`--font-display`): Fraunces - a serif with real character, used for
  marketing headings and the wordmark. Never used for dense UI text.
- **UI/data** (`--font-ui`): Geist Sans - chosen for legibility in dense gradebook
  tables at small sizes. Geist Mono (`--font-mono`) is available for tabular numeric
  alignment (grades, attendance counts).

Both apps (`apps/web`, `apps/website`) load these fonts locally via `next/font`
(no runtime dependency on a third-party font CDN) and reference the same CSS
variable names, so the theme file is the single source of truth.

## Using the theme

Each consuming app imports the theme once in its global stylesheet:

```css
@import 'tailwindcss';
@import '@openregistro/ui/theme.css';
```

Tailwind v4's `@theme` directive turns every custom property in `theme.css` into
utility classes automatically (`--color-primary-600` -> `bg-primary-600`,
`text-primary-600`, `border-primary-600`, etc.). Semantic tokens (`--color-surface`,
`--color-muted-foreground`, ...) flip automatically when the `.dark` class is present
on `<html>`.

## Components

Import directly from the package root:

```tsx
import { Button, Card, CardContent, Input, Label } from '@openregistro/ui';
```

Components are intentionally un-exotic shadcn/ui-style wrappers around Radix
primitives, styled with the tokens above via `class-variance-authority` and a
`cn()` (clsx + tailwind-merge) helper. They live in the monorepo rather than behind
an opaque package boundary so product code can extend or override them directly
when a screen needs something the base set does not provide.
