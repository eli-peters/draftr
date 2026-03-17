# Draftr Design System

Single source of truth for all visual and UI decisions. Reference this file when building components.

---

## 1. Colour Architecture

### Layer 1 — Brand Primitives

Source of truth: `src/tokens/brand.tokens.json` (W3C DTCG format).
Generated into `src/themes/default.ts` by Style Dictionary (`npm run tokens`).
Injected as CSS custom properties by `ThemeProvider` at runtime.

**App defaults:**

| Token               | Hex       | Usage                              |
|----------------------|-----------|------------------------------------|
| `--brand-primary`    | `#86142F` | CTAs, links, active states         |
| `--brand-danger`     | `#C10F33` | Cancel, warnings, destructive      |
| `--brand-accent`     | `#0085B6` | Subtle accents, hover states       |
| `--brand-black`      | `#201D1D` | Text, dark mode background         |
| `--brand-white`      | `#FFFFFF` | Light backgrounds, text on dark    |
| `--brand-muted`      | `#999FA3` | Muted text, borders, disabled      |

Clubs can selectively override specific primitives; unspecified tokens fall back to these defaults.

### Layer 2 — Semantic Tokens (what components use)

Defined in `src/app/globals.css`. Components **never** reference `--brand-*` directly.

| Semantic Token          | Light Mode Source                        | Dark Mode Source                         |
|-------------------------|------------------------------------------|------------------------------------------|
| `--primary`             | `--brand-primary`                        | `--brand-primary`                        |
| `--primary-foreground`  | `--brand-white`                          | `--brand-white`                          |
| `--destructive`         | `--brand-danger`                         | `--brand-danger` (brightened)            |
| `--background`          | `--brand-white`                          | `--brand-black`                          |
| `--foreground`          | `--brand-black`                          | `--brand-white` (softened)               |
| `--muted`               | `--brand-muted` at 15%                   | `--brand-black` lightened                |
| `--muted-foreground`    | `--brand-muted`                          | `--brand-muted`                          |
| `--border`              | `--brand-muted` at 30%                   | `--brand-white` at 10%                   |
| `--card`                | `--brand-white`                          | `--brand-black` lightened                |
| `--ring`                | `--brand-primary`                        | `--brand-primary`                        |

### Accessibility

Some brand colours may not meet WCAG AA contrast ratios (4.5:1 for text, 3:1 for large text). When using brand colours on white or dark backgrounds, test and adjust. The `color-mix()` functions in `globals.css` help derive accessible variants.

### Switching Clubs

1. Create a club override in `src/themes/clubs/` with only the primitives that differ
2. Register it in `src/themes/index.ts`
3. Pass the resolved theme to `<ThemeProvider club={resolvedTheme}>`
4. CSS custom properties update → semantic tokens recalculate → app re-skins
5. No component changes needed

---

## 2. Typography

### Font Stack

| Purpose    | Font             | Weights    | CSS Variable        |
|------------|------------------|------------|---------------------|
| Headings   | Inter            | 600, 700   | `--font-sans`       |
| Body       | Inter            | 400, 500   | `--font-sans`       |
| Mono/Stats | JetBrains Mono   | 400, 500   | `--font-geist-mono` |

### Type Scale (mobile-first, rem)

| Name      | Size            | Usage                        |
|-----------|-----------------|------------------------------|
| Display   | 2rem / 32px     | Page titles                  |
| H1        | 1.5rem / 24px   | Section headers              |
| H2        | 1.25rem / 20px  | Card titles                  |
| H3        | 1.125rem / 18px | Subsections                  |
| Body      | 1rem / 16px     | Default text                 |
| Body-sm   | 0.875rem / 14px | Secondary info               |
| Caption   | 0.75rem / 12px  | Timestamps, labels           |
| Mono      | 0.875rem / 14px | Stats, distances, pace       |

### Line Heights

- Headings: `1.2`
- Body: `1.5`
- Mono: `1.4`

---

## 3. Spacing Scale

4px base unit:

| Token | Value           | Tailwind     |
|-------|-----------------|--------------|
| xs    | 4px (0.25rem)   | `p-1`        |
| sm    | 8px (0.5rem)    | `p-2`        |
| md    | 16px (1rem)     | `p-4`        |
| lg    | 24px (1.5rem)   | `p-6`        |
| xl    | 32px (2rem)     | `p-8`        |
| 2xl   | 48px (3rem)     | `p-12`       |
| 3xl   | 64px (4rem)     | `p-16`       |

---

## 4. Border Radius

| Token | Value    | Usage                        | Tailwind        |
|-------|----------|------------------------------|-----------------|
| sm    | 4px      | Pills, tags                  | `rounded-sm`    |
| md    | 8px      | Cards, inputs                | `rounded-md`    |
| lg    | 12px     | Modals, bottom sheets        | `rounded-lg`    |
| full  | 9999px   | Avatars, circular buttons    | `rounded-full`  |

---

## 5. Shadows (Elevation)

| Level | Value                              | Usage                      |
|-------|------------------------------------|----------------------------|
| sm    | `0 1px 2px rgba(0,0,0,0.05)`      | Cards at rest              |
| md    | `0 4px 6px rgba(0,0,0,0.07)`      | Cards on hover, dropdowns  |
| lg    | `0 10px 15px rgba(0,0,0,0.1)`     | Modals, bottom sheets      |

---

## 6. Component Patterns

### Button

| Variant    | Background          | Text                  | Border |
|------------|---------------------|-----------------------|--------|
| Primary    | `bg-primary`        | `text-primary-foreground` | none |
| Secondary  | `bg-secondary`      | `text-secondary-foreground` | none |
| Destructive| `bg-destructive`    | `text-white`          | none   |
| Ghost      | transparent         | `text-foreground`     | none   |
| Outline    | transparent         | `text-foreground`     | `border-border` |

Sizes: `sm` (h-8), `default` (h-10), `lg` (h-12)

### Card (Ride Card)

- Padding: `p-4`
- Radius: `rounded-md`
- Shadow: `shadow-sm`, hover: `shadow-md`
- Border: `border border-border`

### Badge/Tag

- Padding: `px-2 py-0.5`
- Radius: `rounded-sm`
- Font: `text-xs font-medium`

### Avatar

| Size | Dimensions | Usage              |
|------|------------|--------------------|
| sm   | 32px       | Inline, lists      |
| md   | 40px       | Cards, comments    |
| lg   | 56px       | Profile header     |

All: `rounded-full`

### Bottom Tab Bar

- Height: 56px + safe area inset
- 5 tabs max (4 for riders, 5 for leaders/admins)
- Active: `text-primary`, Inactive: `text-muted-foreground`
- Icon: 20px, Label: 12px

### Toast/Notification

- Position: top-center on mobile, top-right on desktop
- Duration: 4s default, 6s for errors
- Variants: success (primary), warning (amber), error (destructive), info (muted)

### Empty State

- Icon: 48px, `text-muted-foreground`
- Headline: `text-lg font-medium`
- Body: `text-sm text-muted-foreground`
- Optional CTA button below

---

## 7. Motion & Animation

| Token   | Duration | Usage                        |
|---------|----------|------------------------------|
| fast    | 150ms    | Button presses, toggles      |
| normal  | 250ms    | Page transitions, card hover |
| slow    | 350ms    | Modals, overlays             |

### Easing

- Entrances: `ease-out`
- Exits: `ease-in`
- State changes: `ease-in-out`

### Micro-interactions

- Button press: `scale(0.97)`
- Card hover: `translateY(-2px)`
- Loading: skeleton shimmer animation

---

## 8. Dark Mode

- Toggled via `.dark` class on `<html>` (managed by `ThemeProvider`)
- Default: follows OS preference (`prefers-color-scheme`); manual override in Profile → Appearance (System / Light / Dark)
- Preference persisted in `localStorage` under key `draftr-theme`
- FOUC prevention: inline `<script>` in `<head>` applies `.dark` before React hydrates
- Both modes are equal — neither is the "primary" design target

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#F8F8F7` | `var(--brand-black)` (#201D1D) |
| `--card` | `var(--brand-white)` | `color-mix(in oklch, var(--brand-black) 90%, var(--brand-white))` (~#2A2626) |
| `--foreground` | `var(--brand-black)` | `color-mix(in oklch, var(--brand-white) 93%, var(--brand-muted))` |
| `--border` | `color-mix(… --brand-muted 30%, white)` | `color-mix(in oklch, var(--brand-white) 10%, transparent)` |
| `--primary` | `var(--brand-primary)` | `var(--brand-primary)` (shared) |
| `--destructive` | `var(--brand-danger)` | `color-mix(in oklch, var(--brand-danger) 90%, var(--brand-white))` |

Dark tokens derive from the same brand primitives via `color-mix()`. Any club providing 6 brand colours gets both modes automatically.

---

## 9. Breakpoints

| Token | Width  | Usage        |
|-------|--------|--------------|
| sm    | 640px  | Large phones |
| md    | 768px  | Tablets      |
| lg    | 1024px | Desktop      |

**Design mobile-first.** The app is a PWA used primarily on phones.

---

## 10. Theming Architecture

```
src/tokens/brand.tokens.json     → Brand primitives source of truth (DTCG JSON)
src/tokens/build.ts              → Style Dictionary build script
src/themes/default.ts            → Generated app default theme
src/themes/clubs/                → Club-specific overrides (partial primitives)
src/themes/index.ts              → Theme registry + resolveClubTheme()
src/components/theme-provider.tsx → Injects --brand-* CSS vars at runtime
src/app/globals.css              → Semantic tokens reference --brand-* vars
```

Token pipeline: `brand.tokens.json` → Style Dictionary → `default.ts` + Figma values.
Club overrides merge onto the default. CSS `color-mix()` formulas recalculate automatically.

---

## 11. File Architecture (Separation of Concerns)

| Layer            | Location                  | Rule                                     |
|------------------|---------------------------|------------------------------------------|
| Content/copy     | `src/content/`            | All user-facing strings. Never inline.    |
| Design tokens    | `src/app/globals.css`     | CSS custom properties via `@theme`        |
| Token source     | `src/tokens/`             | DTCG JSON → Style Dictionary pipeline     |
| Theme/brand      | `src/themes/`             | Generated default + club overrides        |
| Nav config       | `src/config/`             | Navigation items, feature flags           |
| Business config  | Database (Supabase)       | Pace groups, locations, tags, rules       |
| Environment      | `.env.local`              | API keys, URLs                            |
| Components       | `src/components/`         | Pure, data-driven, props/context only     |
