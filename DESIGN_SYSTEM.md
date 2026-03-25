# Draftr Design System

Single source of truth for all visual and UI decisions. Reference this file when building components.

---

## 1. Colour Architecture

### Three-Layer System

```
Layer 1: Primitive Ramps    → --color-{family}-{step}     (auto-generated from JSON)
Layer 2: Semantic Tokens    → --surface-*, --text-*, etc.  (auto-generated from JSON)
Layer 3: shadcn Bridge      → --primary, --background      (hand-maintained in globals.css)
```

### Layer 1 — Primitive Ramps

Source of truth: `src/tokens/primitives.json` (synced from Figma).
Generated into CSS by `npm run tokens:build`.

**7 colour families, each with full 50–950 ramp:**

| Family    | Base (500) | Description                      |
| --------- | ---------- | -------------------------------- |
| primary   | `#DE0387`  | Magenta — hero brand colour      |
| secondary | `#2D7F94`  | Muted deep teal — supporting     |
| neutral   | `#7C7074`  | Warm slate — pink undertone      |
| success   | `#18A85C`  | Warm green                       |
| warning   | `#F59A06`  | Warm amber                       |
| error     | `#EF4444`  | True red (distinct from magenta) |
| info      | `#4574CB`  | Cool slate blue                  |

CSS variable format: `--color-primary-500`, `--color-neutral-100`, etc.

### Layer 2 — Semantic Tokens

Source of truth: `src/tokens/semantics.json` (synced from Figma).
Describes _intent_, not _hue_. Has explicit light/dark mode values.

| Category | Examples                                            | Usage                        |
| -------- | --------------------------------------------------- | ---------------------------- |
| surface  | `--surface-default`, `--surface-page`, `-raised`    | Backgrounds, cards, modals   |
| text     | `--text-primary`, `--text-secondary`, `--text-on-*` | Foreground text              |
| border   | `--border-subtle`, `--border-default`, `-focus`     | Edges, dividers, focus rings |
| action   | `--action-primary-default`, `--action-danger-*`     | Buttons, CTAs, interactive   |
| feedback | `--feedback-success-*`, `--feedback-error-*`        | Banners, toasts, validation  |

### Layer 3 — shadcn Bridge

Maps semantic tokens to shadcn/ui's expected names (`--primary`, `--background`, etc.) so all existing components work without changes. Hand-maintained in `globals.css`.

### Switching Clubs

1. Create a club override in `src/themes/clubs/` with `primary` and `secondary` seed colours
2. Register it in `src/themes/index.ts`
3. Pass the resolved theme to `<ThemeProvider club={resolvedTheme}>`
4. ThemeProvider injects seed colours → CSS primitives update → semantics recalculate
5. No component changes needed

### Updating Tokens

See `docs/updating-tokens.md` for the full designer/developer workflow.

---

## 2. Typography

### Font Stack

| Purpose | Font           | Weights            | CSS Variable     |
| ------- | -------------- | ------------------ | ---------------- |
| Display | Outfit         | 600, 700, 800      | `--font-display` |
| Body    | DM Sans        | 400, 500, 600, 700 | `--font-sans`    |
| Data    | JetBrains Mono | 400, 500, 600      | `--font-mono`    |

Headings automatically use `font-display` (Outfit) via the `@layer base` rule. Body text uses `font-sans` (DM Sans). Data/stats use `font-mono` (JetBrains Mono).

### Type Scale (mobile-first)

| Token       | Size | Font    | Weight | Usage                         |
| ----------- | ---- | ------- | ------ | ----------------------------- |
| display/2xl | 48px | Outfit  | 800    | Hero headlines, onboarding    |
| display/xl  | 40px | Outfit  | 700    | Page titles                   |
| display/lg  | 32px | Outfit  | 700    | Section headers               |
| heading/lg  | 24px | Outfit  | 600    | Card titles, ride names       |
| heading/md  | 20px | Outfit  | 600    | Subsections, dialog titles    |
| heading/sm  | 18px | Outfit  | 600    | List group headers            |
| body/lg     | 16px | DM Sans | 400    | Primary body, descriptions    |
| body/md     | 14px | DM Sans | 400    | Standard body, buttons        |
| body/sm     | 13px | DM Sans | 400    | Secondary body, helper text   |
| caption     | 12px | DM Sans | 500    | Timestamps, metadata          |
| overline    | 11px | DM Sans | 600    | Section labels, table headers |
| data/lg     | 24px | JB Mono | 600    | Hero stats, dashboard         |
| data/md     | 16px | JB Mono | 500    | Inline stats, leaderboard     |
| data/sm     | 12px | JB Mono | 400    | Secondary data, token values  |

---

## 3. Spacing Scale

4px base unit:

| Token | Value         | Tailwind |
| ----- | ------------- | -------- |
| xs    | 4px (0.25rem) | `p-1`    |
| sm    | 8px (0.5rem)  | `p-2`    |
| md    | 16px (1rem)   | `p-4`    |
| lg    | 24px (1.5rem) | `p-6`    |
| xl    | 32px (2rem)   | `p-8`    |
| 2xl   | 48px (3rem)   | `p-12`   |
| 3xl   | 64px (4rem)   | `p-16`   |

---

## 4. Border Radius

| Token | Value  | Usage                     | Tailwind       |
| ----- | ------ | ------------------------- | -------------- |
| sm    | 6px    | Pills, tags               | `rounded-sm`   |
| md    | 8px    | Cards, inputs             | `rounded-md`   |
| lg    | 10px   | Base radius               | `rounded-lg`   |
| xl    | 14px   | Modals, bottom sheets     | `rounded-xl`   |
| 2xl   | 18px   | Large containers          | `rounded-2xl`  |
| full  | 9999px | Avatars, circular buttons | `rounded-full` |

---

## 5. Shadows (Elevation)

Warm undertone matching the neutral palette (rgba based on neutral-950):

| Level | Light                             | Dark                          | Usage                     |
| ----- | --------------------------------- | ----------------------------- | ------------------------- |
| sm    | `0 1px 2px rgba(26,21,23,0.05)`   | `0 1px 2px rgba(0,0,0,0.3)`   | Cards at rest             |
| md    | `0 4px 8px rgba(26,21,23,0.08)`   | `0 4px 8px rgba(0,0,0,0.4)`   | Cards on hover, dropdowns |
| lg    | `0 12px 24px rgba(26,21,23,0.12)` | `0 12px 24px rgba(0,0,0,0.5)` | Modals, bottom sheets     |

---

## 6. Component Patterns

### Button

| Variant     | Background          | Text                        | Border          |
| ----------- | ------------------- | --------------------------- | --------------- |
| Primary     | `bg-primary`        | `text-primary-foreground`   | none            |
| Secondary   | `bg-secondary`      | `text-secondary-foreground` | none            |
| Destructive | `bg-destructive/10` | `text-destructive`          | none            |
| Ghost       | transparent         | `text-foreground`           | none            |
| Outline     | transparent         | `text-foreground`           | `border-border` |
| Link        | transparent         | `text-primary`              | none            |

Sizes: `xs` (h-7), `sm` (h-8), `default` (h-10), `lg` (h-11), `icon` (size-10), `icon-sm` (size-8)

### Card (Ride Card)

All ride cards: `rounded-2xl`, stroke only (no shadow), `overflow-clip`.

| Property | Home              | Rides             | Schedule          | Manage                  |
| -------- | ----------------- | ----------------- | ----------------- | ----------------------- |
| Layout   | Card              | Card              | Card              | Grouped list in one Card |
| Border   | `border-subtle`   | `border-default`  | `border-default`  | `border-default`        |
| Content  | `p-4`             | `p-6`             | `px-6 pt-3 pb-6`  | `px-5 py-4` per row     |
| Footer   | —                 | `bg-surface-page` | `bg-surface-page` | CapacityBar per row     |
| Banner   | optional (status) | optional (status)  | always (signup)   | inline badges           |

### Action Card (Dashboard)

Contextual action prompts on the Home dashboard. Answer "What needs your attention right now?"

- Container: `Card` with `overflow-clip p-0`
- Banner: `CardBanner` with semantic color per type (same component as ride/schedule cards)
- Content: `p-5`, ride title (heading/sm) + `DateTimeRow` + optional metadata
- Entire card is tappable → navigates to relevant page (no caret)

| Variant | Banner bg | Banner text | Rationale |
| --- | --- | --- | --- |
| Your Next Ride | `feedback-success-bg` | `feedback-success-text` | Mirrors Schedule CONFIRMED |
| Waitlisted | `feedback-warning-bg` | `feedback-warning-text` | Mirrors Schedule WAITLISTED |
| Next Led Ride | `accent-secondary-subtle` | `accent-secondary-default` | Leadership = secondary |
| Weather Watch | `feedback-warning-bg` | `feedback-warning-text` | Alert state = warning |
| Pending Approvals | `accent-primary-subtle` | `accent-primary-default` | Admin action = primary |
| Rides Need Leader | `accent-primary-subtle` | `accent-primary-default` | Admin action = primary |

### Badge/Tag

Two-tier badge system with semantic variants:

| Shape   | Class          | Usage                        |
| ------- | -------------- | ---------------------------- |
| pill    | `rounded-full` | Default — pace, status, role |
| rounded | `rounded-md`   | Contextual variants          |
| subtle  | `rounded`      | Inline labels                |

Sizes: `default` (h-[1.375rem] px-2.5 py-0.5 text-xs), `sm` (px-3 py-1.5 text-xs), `lg` (px-3 py-1 text-sm)

Variants use dedicated badge tokens (`bg-badge-{category}-{name}-bg`, `text-badge-{category}-{name}-text`):

- **Pace (1–8):** Color-coded warm spectrum for skill-level identification
- **Status:** cancelled, full, confirmed, paused
- **Role:** leader, admin, new
- **General:** vibe (gray), count, tag-selected, default, secondary, destructive, warning, outline

### Avatar

| Size | Dimensions | Usage           |
| ---- | ---------- | --------------- |
| sm   | 32px       | Inline, lists   |
| md   | 40px       | Cards, comments |
| lg   | 56px       | Profile header  |

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

| Token  | Duration | Usage                        |
| ------ | -------- | ---------------------------- |
| fast   | 150ms    | Button presses, toggles      |
| normal | 250ms    | Page transitions, card hover |
| slow   | 350ms    | Modals, overlays             |

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

Light and dark values are defined explicitly in `src/tokens/semantics.json` (no `color-mix()` derivation for semantics). Each semantic token has separate Light and Dark aliases pointing to different primitive ramp steps.

| Semantic Token      | Light Primitive  | Dark Primitive |
| ------------------- | ---------------- | -------------- |
| `--surface-default` | neutral/0 (#FFF) | neutral/900    |
| `--surface-page`    | neutral/50       | neutral/950    |
| `--text-primary`    | neutral/900      | neutral/50     |
| `--action-primary`  | primary/500      | primary/400    |
| `--border-default`  | neutral/200      | neutral/700    |
| `--feedback-error`  | error/600        | error/400      |

---

## 9. Breakpoints

| Token | Width  | Usage        |
| ----- | ------ | ------------ |
| sm    | 640px  | Large phones |
| md    | 768px  | Tablets      |
| lg    | 1024px | Desktop      |

**Design mobile-first.** The app is a PWA used primarily on phones.

---

## 10. Theming Architecture

```
src/tokens/primitives.json        → Canonical colour ramps (synced from Figma)
src/tokens/semantics.json          → Canonical semantic mappings (synced from Figma)
src/tokens/generated/tokens.css    → Auto-generated CSS (npm run tokens:build)
src/app/globals.css                → shadcn bridge + component tokens (hand-maintained)
src/themes/default.ts              → App default seed colours
src/themes/clubs/                  → Club-specific overrides (partial seeds)
src/themes/index.ts                → Theme registry + resolveClubTheme()
src/components/theme-provider.tsx  → Injects seed overrides for non-default clubs
```

Club overrides provide `primary` and `secondary` seed colours. ThemeProvider injects these, overriding the CSS primitive values. Semantic tokens auto-update via `var()` references.

---

## 11. File Architecture (Separation of Concerns)

| Layer           | Location              | Rule                                             |
| --------------- | --------------------- | ------------------------------------------------ |
| Content/copy    | `src/content/`        | All user-facing strings. Never inline.           |
| Design tokens   | `src/app/globals.css` | CSS custom properties via `@theme`               |
| Theme/brand     | `src/themes/`         | Default + club overrides                         |
| App config      | `src/config/`         | Routes, navigation, formatting, status constants |
| Business config | Database (Supabase)   | Pace groups, locations, tags, rules              |
| Environment     | `.env.local`          | API keys, URLs                                   |
| Components      | `src/components/`     | Pure, data-driven, props/context only            |

## 12. Action Positioning

Three-tier convention for where functional actions (filter, sort, search, create, etc.) live relative to page hierarchy. Components: `PageHeader` (`src/components/layout/page-header.tsx`), `ContentToolbar` (`src/components/layout/content-toolbar.tsx`).

### Page-Level Actions

Actions that affect the entire page: create, export, primary CTA.

- Use `PageHeader` with the `actions` prop — renders inline with the H1 on the same row.
- Examples: "Create Ride" button on Manage, "Edit" on Ride Detail.

### Section-Level Actions

Actions that control a content area: filter, sort, search, refresh.

- Use `ContentToolbar` with `left` / `right` slots — positioned below tabs or segmented controls, above the content list.
- `left`: heading, result count, or filter summary.
- `right`: filter drawer, sort controls, refresh button.
- Examples: ride feed filter/sort, manage rides filter below tabs, member search/filter.

### Contextual Actions

Actions that appear based on state or selection: approve, edit role, delete.

- Render inline on individual items (cards, rows), only visible when relevant.
- Never permanently visible in the page chrome — they belong to the item they act on.
- Examples: approve button on pending members, role dropdown on active members.
