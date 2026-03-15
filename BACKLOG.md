# Draftr — Development Backlog

Items that come up during development. For the full project roadmap, see the [Notion space](https://www.notion.so/323b2c8bb9f8815ca3ffcd8913b6c444).

---

## Future Considerations

- [ ] **Social media logins (Google/Apple SSO)** — Supabase Auth supports this natively, but need to handle the case where a rider was originally invited by email and later wants to link a social login to the same account. Supabase has account linking, but test carefully. Don't implement until email auth is stable.

## Tech Debt / Improvements

- [ ] **Next.js 16 middleware deprecation** — `middleware.ts` convention is deprecated in favour of `proxy`. Migrate when the proxy API is stable and Supabase SSR supports it.

## Deferred Features

_Move items here from Notion roadmap when they need dev-level notes._
