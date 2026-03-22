# End-of-Day Code Review

A comprehensive review skill that scans the day's work through the lens of a staff engineer and staff designer.

## Usage

Run at the end of your working day:

```
/eod-review
```

## What It Does

The review scans all files changed today (from git commits and unstaged changes) across six phases:

1. **Scope** — Identifies and groups all changed files by type (components, routes, queries, migrations, etc.)
2. **Code Quality** — Runs the code-simplifier agent and checks for dead code, unused imports, duplicated logic, `any` types, overly complex functions
3. **Hardcoding & Conventions** — Scans for raw hex colors, inline strings, hardcoded routes, direct brand tokens, Tailwind v4 violations
4. **Architecture & Logic** — Reviews component purity, data layer patterns, security, error handling, null safety, race conditions
5. **Design & UX** — Checks semantic token usage, typography, responsive design, dark mode parity, accessibility, interaction patterns
6. **Report** — Produces a structured report with CRITICAL / WARNING / INFO severity levels and suggested fixes

## When to Run

- At the end of every working day before wrapping up
- Before creating a pull request
- After a large feature implementation

## What It Catches

- Code hallucinations and dead code
- Hardcoded values that violate separation of concerns
- Security issues (exposed secrets, missing auth checks, SQL injection)
- Architecture problems (components doing too much, prop drilling, N+1 queries)
- Design inconsistencies (wrong fonts, missing dark mode, broken responsive layouts)
- Accessibility gaps (heading hierarchy, focus states, aria labels)

## Pairs Well With

- `/consolidate-memory` — Run after eod-review to save decisions and patterns to memory
- `/brand-check` — Focused hardcoding scan (subset of what eod-review covers)
- `/rls-check` — Deep RLS audit (eod-review does a lighter check when migrations are changed)
