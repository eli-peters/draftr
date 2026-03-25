<p align="center">
  <img alt="Draftr" src="public/icons/logo.svg" width="240">
</p>

<p align="center">
  <strong>A rider-first cycling club management app.</strong><br>
  Organize rides, manage members, coordinate pace groups — all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-58c4dc?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind v4">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel" alt="Vercel">
</p>

---

## What is Draftr?

Draftr replaces clunky, outdated cycling club tools with a modern, mobile-first progressive web app. It's built for riders who want to see what's coming up, sign up fast, and get out the door — and for ride leaders and admins who need to manage it all without spreadsheets.

### Features

- **Ride coordination** — Create, edit, and manage group rides with pace groups, meeting points, and route details
- **Member management** — Admin-gated invitations, role-based access (rider, ride leader, admin)
- **Multi-club architecture** — Every table is club-scoped from day one, ready for multiple clubs
- **Themeable** — Three-layer token system lets each club override brand colors while keeping visual consistency
- **Dark mode** — Full light/dark support with equal design parity
- **PWA-ready** — Installable, mobile-first, designed for on-the-go use

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                           |
| Language   | TypeScript 5                                      |
| Styling    | Tailwind CSS v4 (CSS-first config)                |
| Components | shadcn/ui (Base UI primitives)                    |
| Icons      | Phosphor Icons                                    |
| Backend    | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Hosting    | Vercel                                            |
| Testing    | Vitest + React Testing Library                    |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/eli-peters/draftr.git
cd draftr

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local  # or create .env.local manually
# Add your Supabase URL and anon key

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier — format all files
npm test             # Vitest — single run
npm run test:watch   # Vitest — watch mode
```

## Project Structure

```
src/
├── app/                    → Routes and pages (App Router)
├── components/
│   ├── ui/                 → shadcn/ui base components
│   ├── layout/             → App shell, nav, header
│   ├── dashboard/          → Dashboard widgets
│   ├── rides/              → Ride cards, feeds, filters
│   └── manage/             → Admin panels
├── config/                 → Routes, navigation, formatting
├── content/                → All user-facing strings (CMS-ready)
├── lib/supabase/           → Client, server, middleware helpers
├── themes/                 → Default theme + club overrides
├── tokens/                 → Design token JSON + generated CSS
├── types/                  → TypeScript type definitions
└── test/                   → Test setup + test files
```

## Architecture Highlights

**No hardcoding** — Content lives in `src/content/`, design tokens in CSS custom properties, routes in `src/config/routes.ts`, business config in the database. Components are pure and data-driven.

**Three-layer theming** — Primitive colour ramps (`--color-{family}-{step}`) provide the raw palette. Semantic tokens (`--surface-*`, `--text-*`, `--action-*`) describe intent, not hue. A shadcn bridge maps these to the component library's expected names. Clubs override seed colours via `ThemeProvider`; everything else cascades automatically.

**Multi-tenant from day one** — All queries filter by `club_id`. No retrofitting needed.

## Contributing

This is a passion project — free, non-commercial, and community-driven. If you're interested in contributing, open an issue to start a conversation.

## License

Private — not currently open-source licensed.
