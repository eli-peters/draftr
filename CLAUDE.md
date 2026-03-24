# Draftr — Claude Code Instructions

## What is this project?

Draftr is a cycling club management PWA. It replaces the Cycle Club App with a modern, rider-first ride coordination tool. Full project spec lives in Notion (see memory for page IDs).

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config with `@theme`, NOT v3's `tailwind.config.ts`)
- **Components:** shadcn/ui (Base UI primitives)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Hosting:** Vercel (auto-deploy from main)
- **Icons:** Phosphor Icons (`@phosphor-icons/react`)

## Critical Rules

### No Hardcoding — Ever

- **Content/copy:** All user-facing strings live in `src/content/`. Never inline strings in components.
- **Design tokens:** All colours, spacing, typography reference CSS custom properties via semantic tokens. Never use raw hex values in components.
- **Theme/brand:** Club-specific values live in `src/themes/`. Components use `--primary`, `--destructive`, etc. — never `--brand-*` directly.
- **Business config:** Pace groups, meeting locations, tags, weather rules come from the database. Never hardcode in code.
- **Navigation/routes:** Routes defined in `src/config/routes.ts`. Nav items in `src/config/navigation.ts`. Never hardcode routes in components.
- **Environment:** API keys, URLs, feature flags via `.env.local`. Never commit secrets.

### Tailwind v4 Specifics

- Theme tokens go in `@theme` blocks in CSS, not in `tailwind.config.ts`
- Use `@import "tailwindcss"` not `@tailwind` directives
- Automatic content detection — no `content` array needed
- CSS custom properties are native — use `color-mix()` for derived values
- Dark mode via `.dark` class (`@custom-variant dark (&:is(.dark *))`)

### Separation of Concerns

| Layer           | Location              | Rule                                             |
| --------------- | --------------------- | ------------------------------------------------ |
| Content/copy    | `src/content/`        | Structured objects, CMS-ready                    |
| Design tokens   | `src/app/globals.css` | CSS custom properties                            |
| Theme/brand     | `src/themes/`         | Typed ClubTheme configs                          |
| App config      | `src/config/`         | Routes, navigation, formatting, status constants |
| Business config | Database              | Pace groups, locations, tags                     |
| Environment     | `.env.local`          | API keys, URLs                                   |
| Components      | `src/components/`     | Pure, data-driven, props only                    |

## Project Structure

```
src/
├── app/                    → Routes and pages
│   ├── globals.css         → shadcn bridge + component tokens (imports generated CSS)
│   ├── layout.tsx          → Root layout (ThemeProvider, fonts: Outfit, DM Sans, JetBrains Mono)
│   ├── (app)/              → Authenticated app routes
│   ├── (auth)/             → Auth routes (login, signup, callback)
│   ├── api/                → API routes (weather sync, etc.)
│   ├── card-showcase/      → Dev: card variant showcase page
│   ├── style-guide/        → Dev: design system reference page
│   └── error.tsx           → Root error boundary
├── components/
│   ├── ui/                 → shadcn/ui components
│   ├── layout/             → App shell, nav components
│   ├── auth/               → Auth-related components
│   ├── dashboard/          → Dashboard widgets
│   ├── dev/                → Dev-only debug tools and utilities
│   ├── manage/             → Admin/leader management components
│   ├── motion/             → Animation wrappers
│   ├── notifications/      → Notification components
│   ├── rides/              → Ride cards, forms, detail views
│   ├── settings/           → Settings UI components
│   ├── weather/            → Weather display components
│   └── theme-provider.tsx  → Club theme injection
├── config/                 → Routes, navigation, formatting, status constants
├── content/                → All user-facing strings
├── hooks/                  → Custom React hooks (useIsMobile, useNavigationDirection)
├── lib/
│   ├── utils.ts            → cn() helper
│   ├── color-mode-script.ts → FOUC prevention script for dark mode
│   ├── phone.ts            → Phone number formatting
│   ├── toast-styles.ts     → Toast notification styling
│   ├── supabase/           → Client, server, middleware helpers
│   ├── auth/               → Auth actions and helpers
│   ├── dev/                → Dev-only utilities
│   ├── manage/             → Admin/leader queries and actions
│   ├── notifications/      → Notification logic
│   ├── profile/            → Profile queries
│   ├── rides/              → Ride queries and actions
│   └── weather/            → Weather sync logic
├── themes/                 → Default theme + club overrides
├── tokens/                 → Design token system
│   ├── primitives.json     → Canonical colour ramps (from Figma)
│   ├── semantics.json      → Canonical semantic mappings (from Figma)
│   └── generated/          → Auto-generated CSS (npm run tokens:build)
├── test/                   → Vitest setup + test files
├── types/                  → TypeScript type definitions
└── proxy.ts                → Next.js proxy config (Supabase session refresh)
```

## Theming Architecture

Three-layer system:

1. **Primitive ramps** (`--color-{family}-{step}`) — auto-generated from `src/tokens/primitives.json`. 7 colour families × 11+ steps each.
2. **Semantic tokens** (`--surface-*`, `--text-*`, `--border-*`, `--action-*`, `--feedback-*`) — auto-generated from `src/tokens/semantics.json`. Explicit light/dark mode values. Describe _intent_, not _hue_.
3. **shadcn bridge** (`--primary`, `--background`, etc.) — hand-maintained in `globals.css`. Maps semantic tokens to shadcn/ui's expected names so existing components work unchanged.

The app ships a default theme with full colour ramps baked into CSS. Clubs provide `primary` and `secondary` seed colours; ThemeProvider injects these to override the 500-step primitives. Semantic tokens auto-update via `var()` references.

Token update workflow: see `docs/updating-tokens.md`.

## Commands

```bash
npm run dev          # Start dev server (auto-runs tokens:build)
npm run build        # Production build (auto-runs tokens:build)
npm run tokens:build # Regenerate CSS from token JSON files
npm run lint         # ESLint
npm run start        # Production server
npm run format       # Prettier — format all files
npm run format:check # Prettier — check without writing
npm test             # Vitest — single run
npm run test:watch   # Vitest — watch mode
```

## Code Quality

### Tooling

- **Prettier** — formats on save via VSCode (`.vscode/settings.json`). Config in `.prettierrc`.
- **ESLint** — auto-fixes on save. `eslint-config-prettier` disables formatting rules that conflict with Prettier.
- **Vitest** — test runner with jsdom, React Testing Library, and `@/` alias. Config in `vitest.config.ts`, setup in `src/test/setup.ts`.

### When things run

| Tool     | On Save     | CI / Build                           |
| -------- | ----------- | ------------------------------------ |
| Prettier | Auto-format | `format:check` (fail if unformatted) |
| ESLint   | Auto-fix    | `lint` (fail on errors)              |
| Vitest   | No          | `test` (fail on failures)            |

## Design Reference

See `DESIGN_SYSTEM.md` for the full visual spec (colours, typography, spacing, component patterns, motion).

## Auth Model (MVP)

Admin-gated — no self-registration. Admins add members by email after OCA registration. Rider receives invite email → sets password → profile setup. Roles: rider, ride_leader, admin (via club_memberships table).

## Multi-Club Architecture

Everything is scoped to a club from day one. The `clubs` table exists for multi-tenancy. All queries filter by `club_id`. Theme configs are per-club (selective overrides on the app default). Content layer is club-agnostic.

## Memory Layer

Three-tier memory system in the project memory directory (`~/.claude/projects/-Users-administrator-Projects-draftr/memory/`):

- **Recent Memory** (`recent-memory.md`) — Rolling 48hr window of decisions, context, and open questions from recent sessions. **Read this at session start for immediate situational awareness.**
- **Long-Term Memory** (`long-term-memory.md`) — Distilled preferences, patterns, and architectural decisions promoted from recent memory. Consult when making architectural or stylistic decisions.
- **Project Memory** (`project-memory.md`) — Active work, recent completions, blockers, and next priorities. Read at session start alongside recent memory.

These complement the existing per-topic memory files (feedback, references, project notes).

Run `/consolidate-memory` periodically to keep memory files current from conversation logs.
