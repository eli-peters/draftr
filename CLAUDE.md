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

| Layer           | Location              | Rule                            |
| --------------- | --------------------- | ------------------------------- |
| Content/copy    | `src/content/`        | Structured objects, CMS-ready   |
| Design tokens   | `src/app/globals.css` | CSS custom properties           |
| Theme/brand     | `src/themes/`         | Typed ClubTheme configs         |
| App config      | `src/config/`         | Routes, navigation, formatting, status constants |
| Business config | Database              | Pace groups, locations, tags    |
| Environment     | `.env.local`          | API keys, URLs                  |
| Components      | `src/components/`     | Pure, data-driven, props only   |

## Project Structure

```
src/
├── app/                    → Routes and pages
│   ├── globals.css         → Tailwind v4 theme + semantic tokens
│   ├── layout.tsx          → Root layout (ThemeProvider, fonts)
│   └── (app)/              → Authenticated app routes
├── components/
│   ├── ui/                 → shadcn/ui components
│   └── layout/             → App shell, nav components
├── config/                 → Routes, navigation, formatting, status constants
├── content/                → All user-facing strings
├── lib/
│   ├── utils.ts            → cn() helper
│   └── supabase/           → Client, server, middleware helpers
├── themes/                 → Default theme + club overrides
├── test/                   → Vitest setup + test files
├── types/                  → TypeScript type definitions
└── proxy.ts                → Next.js proxy config (Supabase session refresh)
```

## Theming Architecture

Two-layer system:

1. **Brand primitives** (`--brand-primary`, `--brand-danger`, etc.) — set by ThemeProvider from `src/themes/*.ts`
2. **Semantic tokens** (`--primary`, `--destructive`, `--background`, etc.) — defined in `globals.css`, reference brand primitives

The app ships a default theme (all 6 primitives). Clubs selectively override specific primitives (e.g., just `primary` + `accent`); unspecified tokens fall back to the app default. This maintains visual consistency across all clubs.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
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
