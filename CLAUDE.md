# Draftr — Claude Code Instructions

## What is this project?

Draftr is a cycling club management PWA, initially built for Dark Horse Flyers (Toronto, ~1,000 members). It replaces the Cycle Club App with a modern, rider-first ride coordination tool. Full project spec lives in Notion (see memory for page IDs).

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config with `@theme`, NOT v3's `tailwind.config.ts`)
- **Components:** shadcn/ui (Radix-based)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Hosting:** Vercel (auto-deploy from main)
- **Icons:** Lucide React

## Critical Rules

### No Hardcoding — Ever

- **Content/copy:** All user-facing strings live in `src/content/`. Never inline strings in components.
- **Design tokens:** All colours, spacing, typography reference CSS custom properties via semantic tokens. Never use raw hex values in components.
- **Theme/brand:** Club-specific values live in `src/themes/`. Components use `--primary`, `--destructive`, etc. — never `--brand-*` directly.
- **Business config:** Pace groups, meeting locations, tags, weather rules come from the database. Never hardcode in code.
- **Navigation:** Nav items defined in `src/config/navigation.ts`. Never hardcode routes in layout components.
- **Environment:** API keys, URLs, feature flags via `.env.local`. Never commit secrets.

### Tailwind v4 Specifics

- Theme tokens go in `@theme` blocks in CSS, not in `tailwind.config.ts`
- Use `@import "tailwindcss"` not `@tailwind` directives
- Automatic content detection — no `content` array needed
- CSS custom properties are native — use `color-mix()` for derived values
- Dark mode via `.dark` class (`@custom-variant dark (&:is(.dark *))`)

### Separation of Concerns

| Layer | Location | Rule |
|-------|----------|------|
| Content/copy | `src/content/` | Structured objects, CMS-ready |
| Design tokens | `src/app/globals.css` | CSS custom properties |
| Theme/brand | `src/themes/` | Typed ClubTheme configs |
| Nav config | `src/config/` | Navigation items, feature flags |
| Business config | Database | Pace groups, locations, tags |
| Environment | `.env.local` | API keys, URLs |
| Components | `src/components/` | Pure, data-driven, props only |

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
├── config/                 → Navigation, feature flags
├── content/                → All user-facing strings
├── lib/
│   ├── utils.ts            → cn() helper
│   └── supabase/           → Client, server, middleware helpers
├── themes/                 → Per-club brand configs
├── types/                  → TypeScript type definitions
└── middleware.ts            → Supabase session refresh
```

## Theming Architecture

Two-layer system:
1. **Brand primitives** (`--brand-primary`, `--brand-danger`, etc.) — set by ThemeProvider from `src/themes/*.ts`
2. **Semantic tokens** (`--primary`, `--destructive`, `--background`, etc.) — defined in `globals.css`, reference brand primitives

Switching clubs = passing a different `ClubTheme` to `<ThemeProvider>`. No component changes.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Design Reference

See `DESIGN_SYSTEM.md` for the full visual spec (colours, typography, spacing, component patterns, motion).

## Auth Model (MVP)

Admin-gated — no self-registration. Admins add members by email after OCA registration. Rider receives invite email → sets password → profile setup. Roles: rider, ride_leader, admin (via club_memberships table).

## Multi-Club Architecture

Everything is scoped to a club from day one. The `clubs` table exists even though only DHF uses it initially. All queries filter by `club_id`. Theme configs are per-club. Content layer is club-agnostic.
