# Theming — How It Works

## Overview

Draftr uses a two-layer theming system. The app ships with a default theme, and clubs can selectively override specific brand primitives without changing any component code.

## How it works

1. **Brand primitives** — 6 raw colour values defined in `src/themes/default.ts`.
2. **Semantic tokens** — What components actually use (`--primary`, `--background`, etc.), defined in `src/app/globals.css` using `color-mix()` formulas that reference brand primitives.

The `ThemeProvider` injects brand primitives as CSS custom properties at runtime. Semantic tokens recalculate automatically. Components only ever use semantic tokens.

Edit `src/themes/default.ts` to change the app's default colours.

## Adding a club theme

Clubs only need to specify the primitives they want to change. Unspecified tokens fall back to the app default.

1. Create `src/themes/clubs/<club-slug>.ts`:

```ts
import type { ClubOverride } from '@/types/theme';

export const myClub: ClubOverride = {
  slug: 'my-club',
  name: 'My Cycling Club',
  colors: {
    primary: '#2E5A1C', // Only override what differs
    accent: '#D4A017',
  },
};
```

2. Register it in `src/themes/index.ts`:

```ts
import { myClub } from './clubs/my-club';

const clubOverrides: Record<string, ClubOverride> = {
  [myClub.slug]: myClub,
};
```

3. `getTheme("my-club")` returns a fully resolved `ClubTheme` with the overrides merged onto the default.

## Dark mode

Managed by `ThemeProvider`. Three modes: `light`, `dark`, `system` (default). The `.dark` class is toggled on `<html>`. All semantic tokens have dark mode mappings in `globals.css` — any club providing brand overrides gets both modes automatically.

