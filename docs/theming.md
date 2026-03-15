# Theming — How It Works

## Overview

Draftr uses a two-layer theming system so any cycling club can have their own brand colours without changing any component code.

## How it works

1. **Brand primitives** — Raw colour values for a specific club, defined in `src/themes/<club-slug>.ts`
2. **Semantic tokens** — What components actually use (`--primary`, `--background`, etc.), defined in `src/app/globals.css`

The `ThemeProvider` component injects brand primitives as CSS custom properties at runtime. Semantic tokens in `globals.css` reference those primitives. Components only ever use semantic tokens.

## Adding a new club theme

1. Create `src/themes/<club-slug>.ts`:

```ts
import type { ClubTheme } from "@/types/theme";

export const myClubTheme: ClubTheme = {
  slug: "my-club",
  name: "My Cycling Club",
  colors: {
    primary: "#...",   // Main brand colour
    danger: "#...",    // Warnings, destructive actions
    accent: "#...",    // Subtle accents
    black: "#...",     // Dark text / dark mode bg
    white: "#FFFFFF",  // Light bg
    muted: "#...",     // Muted text, borders
  },
};
```

2. Register it in `src/themes/index.ts`:

```ts
import { myClubTheme } from "./my-club";

const themes: Record<string, ClubTheme> = {
  // ... existing themes
  [myClubTheme.slug]: myClubTheme,
};
```

3. Pass it to the `ThemeProvider` (this will eventually come from the database based on which club the user belongs to).

## Modifying DHF colours

Edit `src/themes/dhf.ts`. The CSS custom properties update automatically — no need to touch `globals.css` or any components.

## Dark mode

Managed by `ThemeProvider`. Three modes: `light`, `dark`, `system` (default). The `.dark` class is toggled on `<html>`. All semantic tokens have dark mode mappings in `globals.css`.
