# Performance Audit — Draftr

**Date:** April 11, 2026

---

## Executive Summary

The app has a strong foundation: `React.cache()` deduplicates auth and client creation per request, most pages use `Promise.all`, critical queries are wrapped in `unstable_cache`, and Phosphor icons use the SSR-safe deep import path. The production slowness on first load, login, and cold page visits is caused by **four specific Supabase waterfall patterns** — sequential awaits where work could start immediately. No bundle-size or middleware issues were found.

---

## Findings & Fixes

### 1. Homepage — `getNextAvailableRide` waterfall · **FIXED**

**File:** [src/app/(app)/page.tsx](<src/app/(app)/page.tsx>)  
**Impact: ~200–400 ms on every cold homepage render**

`getNextAvailableRide` was awaited _after_ the main `Promise.all` completed. Because it needs the ride IDs produced by that batch, it couldn't simply be added to the array — but it could be _chained_ off the batch promise so it starts the moment those IDs are available, overlapping with anything else awaiting the same batch.

**Before:**

```ts
const [nextSignup, nextLedRide, nextWaitlistedRide, ...rest] = await Promise.all([...]);
const personalRideIds = [...]; // compute from above
const nextAvailableRide = await getNextAvailableRide(..., personalRideIds); // ← waterfall
```

**After:**

```ts
const batchPromise = Promise.all([...]);

const nextAvailableRidePromise = batchPromise.then(([, nextSignup, nextLedRide, nextWaitlistedRide]) => {
  const ids = [...];
  return getNextAvailableRide(membership.club_id, timezone, ids);
});

const [[...batch], nextAvailableRide] = await Promise.all([batchPromise, nextAvailableRidePromise]);
```

`getNextAvailableRide` now starts as soon as the batch resolves, rather than after all callers of `batchPromise` have also resolved. This eliminates the sequential network round-trip entirely on cache misses.

---

### 2. `getUserNextWaitlistedRide` — query inside for-loop · **FIXED**

**File:** [src/lib/rides/queries.ts](src/lib/rides/queries.ts) — `getUserNextWaitlistedRide`  
**Impact: ~100–200 ms per cache miss (N+1 pattern)**

A Supabase count query was issued _inside_ the `for` loop that searched for the first non-completed ride. Worst case: each iteration cost a full round-trip before the next could be evaluated.

**Before:**

```ts
for (const row of data) {
  if (!row.ride || isRideCompleted(...)) continue;
  const { count } = await supabase.from('ride_signups')...  // ← per-iteration await
  return { ..., waitlist_position: count ?? 1 };
}
return null;
```

**After:**

```ts
// Collect candidates without any async work
const candidates = data.filter(row => row.ride && !isRideCompleted(...));
if (!candidates.length) return null;

// Take soonest (data already ordered by ride_date ASC), then one query
const { row, ride } = candidates[0];
const { count } = await supabase.from('ride_signups')...  // ← single query
return { ..., waitlist_position: count ?? 1 };
```

The loop is now synchronous; the single Supabase query runs once regardless of how many candidate rows exist.

---

### 3. `getRecentAnnouncementCount` — no cache, RLS client · **FIXED**

**File:** [src/lib/manage/queries.ts](src/lib/manage/queries.ts)  
**Impact: ~50–150 ms on every manage dashboard render**

This function was the only unfenced query in `getSectionCardStats`. It bypassed `unstable_cache`, used the RLS-scoped `createClient()` (requires cookie parsing), and re-queried Supabase on every page render. As a result, every admin dashboard load hit the DB even when nothing had changed.

**Before:**

```ts
export async function getRecentAnnouncementCount(clubId: string) {
  const supabase = await createClient();   // RLS client, cookie overhead
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count } = await supabase.from('announcements')...
  return count ?? 0;
}
```

**After:**

```ts
export async function getRecentAnnouncementCount(clubId: string) {
  const weekAgoStr = new Date(Date.now() - 7 * 86400_000).toISOString();
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();  // service role, no cookie cost
      const { count } = await supabase.from('announcements')...
      return count ?? 0;
    },
    ['recent-announcement-count', clubId],
    { tags: [tagAnnouncements(clubId)], revalidate: 300 },
  )();
}
```

Cache is invalidated by `tagAnnouncements(clubId)`, which is already used by the pinned announcement mutation paths.

---

### 4. `PublicProfilePage` — conditional sequential query · **FIXED**

**File:** [src/app/(app)/profile/[userId]/page.tsx](<src/app/(app)/profile/[userId]/page.tsx>)  
**Impact: ~50–100 ms for inactive member profiles**

For deactivated members, `full_name` and `avatar_url` were fetched sequentially _after_ the membership status query returned. Because this data is needed regardless (we render it in both the inactive placeholder and the normal profile), it was moved into the initial parallel batch.

**Before:**

```ts
const [{ data: viewerMembership }, { data: membership }] = await Promise.all([...2 queries...]);

if (membership?.status === MemberStatus.INACTIVE) {
  const { data: basicUser } = await supabase.from('users')...  // ← waterfall
  ...
}
```

**After:**

```ts
const [{ data: viewerMembership }, { data: membership }, { data: basicUser }] =
  await Promise.all([...3 queries, including users fetch...]);

if (membership?.status === MemberStatus.INACTIVE) {
  // basicUser already available — no extra round-trip
}
```

---

## Not Fixed (by design)

### `getUserSignupStatus` — conditional waitlist count

The conditional `await` for waitlist position runs inside `unstable_cache`. On a cache hit (by far the common path) the entire inner function body is skipped — the sequential query never runs. Fixing it would complicate the cached function for negligible real-world gain. Left as-is.

### `getUserRideSignups` — waitlist filter second query

The second query (`allWaitlisted`) already uses an `IN (rideIds)` batch; it's a single round-trip. This is not a per-row waterfall and was correctly implemented. Left as-is.

---

## What's Already Good

| Area                                                                                      | Status                                 |
| ----------------------------------------------------------------------------------------- | -------------------------------------- |
| `React.cache()` on `createClient` and `getUser`                                           | ✅ Correct — one auth call per request |
| `getUserClubMembership` wrapped in `React.cache()`                                        | ✅ Correct                             |
| `unstable_cache` with typed cache tags on all hot paths                                   | ✅ Consistent                          |
| `getLayoutProfile`, `getUserNotifications`, `getPinnedAnnouncement` in parallel in layout | ✅                                     |
| Phosphor icons via `/dist/ssr` (SSR-safe, tree-shaken)                                    | ✅                                     |
| `optimizePackageImports` not required — no barrel import issues                           | ✅                                     |
| Middleware session refresh with no redundant `getUser`                                    | ✅                                     |
| Admin vs. RLS client used appropriately by most cached queries                            | ✅                                     |

---

## Summary of Changes

| File                                                                                 | Change                                                                                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| [src/app/(app)/page.tsx](<src/app/(app)/page.tsx>)                                   | Chain `getNextAvailableRide` off batch promise; eliminate sequential await                                     |
| [src/lib/rides/queries.ts](src/lib/rides/queries.ts)                                 | Remove per-iteration await in `getUserNextWaitlistedRide`; collect candidates synchronously then run one query |
| [src/lib/manage/queries.ts](src/lib/manage/queries.ts)                               | Wrap `getRecentAnnouncementCount` in `unstable_cache`; switch to admin client                                  |
| [src/app/(app)/profile/[userId]/page.tsx](<src/app/(app)/profile/[userId]/page.tsx>) | Move `users` fetch into initial `Promise.all`; remove conditional sequential query                             |

---

## Second Audit — Progressive Streaming

**Date:** April 11, 2026

All pages were audited for streaming opportunities. The pattern applied throughout: extract data-fetching into thin async server components (SCs); wrap each in a `<Suspense fallback={<skeleton>}>` boundary on the page; the page shell renders immediately while each section streams in independently.

---

### 5. App layout — notification fetch blocks every page · **FIXED**

**File:** [src/app/(app)/layout.tsx](<src/app/(app)/layout.tsx>)  
**Impact: Every authenticated page load blocked by `getUserNotifications`**

The layout awaited `getUserNotifications` before sending any HTML. Notification data is UI-only enhancement (badge count + dropdown). It has no effect on the page structure.

**Fix:** Introduced the RSC slot pattern. The layout creates a `notificationsSlot: ReactNode` containing a `<Suspense>` boundary that wraps `<NotificationsLoader>` (a new async SC). The slot propagates through `AppShell` → `HeaderBar` as a pre-built ReactNode. The header renders immediately with a placeholder bell icon; the notification data streams in behind it.

**New file:** [src/components/layout/notifications-loader.tsx](src/components/layout/notifications-loader.tsx)  
**Modified:** `header-bar.tsx`, `app-shell.tsx`, `layout.tsx`

---

### 6. Homepage — 7-query batch blocks full page render · **FIXED**

**File:** [src/app/(app)/page.tsx](<src/app/(app)/page.tsx>)  
**Impact: All homepage content blocked on the slowest of 7 parallel queries**

The homepage ran a `Promise.all` of 6 queries + 1 chained query before rendering anything. The greeting section (just `full_name`) and the action content section (ride cards) are independent and can stream separately.

**Fix:** Page component does only the membership lookup (cheap, `React.cache`'d). Two independent `<Suspense>` sections stream the greeting and action content in parallel.

**New files:** [src/components/dashboard/dashboard-greeting.tsx](src/components/dashboard/dashboard-greeting.tsx), [src/components/dashboard/dashboard-action-content.tsx](src/components/dashboard/dashboard-action-content.tsx)

---

### 7. Admin dashboard — two stat sections block each other · **FIXED**

**File:** [src/app/(app)/manage/page.tsx](<src/app/(app)/manage/page.tsx>)  
**Impact: Stats bento and section cards blocked on each other despite independent data**

`getAdminDashboardStats` (bento tiles) and `getSectionCardStats` (section cards) are independent queries but both blocked the full page.

**Fix:** Two independent `<Suspense>` sections — `<AdminStatsBentoSection>` and `<SectionCardsSection>` — each fetch and render their own data.

**New files:** [src/components/manage/admin-stats-bento-section.tsx](src/components/manage/admin-stats-bento-section.tsx), [src/components/manage/section-cards-section.tsx](src/components/manage/section-cards-section.tsx)

---

### 8. Profile pages — stats + recent rides block identity hero · **FIXED**

**Files:** [src/app/(app)/profile/page.tsx](<src/app/(app)/profile/page.tsx>), [src/app/(app)/profile/[userId]/page.tsx](<src/app/(app)/profile/[userId]/page.tsx>)  
**Impact: Profile identity (name, avatar, bio) blocked on stats 3-sub-query batch + ride history join**

Both profile pages awaited `getUserProfileStats` (3 parallel sub-count queries) and `getUserRecentRides` (join with rides) before rendering anything. The identity hero only needs `getUserProfile` + `paceGroups`.

**Fix:** `ProfilePage` client component refactored to accept `statsSlot: ReactNode` and `recentRidesSlot: ReactNode` props in place of raw data. Two new async SCs — `ProfileStatsSection` and `ProfileRecentRidesSection` — each fetch and render their own section independently. The identity hero renders immediately from the fast `getUserProfile` result.

**New files:** [src/components/profile/profile-stats-section.tsx](src/components/profile/profile-stats-section.tsx), [src/components/profile/profile-recent-rides-section.tsx](src/components/profile/profile-recent-rides-section.tsx)  
**Modified:** `profile-page.tsx` (client component), both profile pages

---

### 9. manage/settings — sequential query waterfall + blocked sections · **FIXED**

**File:** [src/app/(app)/manage/settings/page.tsx](<src/app/(app)/manage/settings/page.tsx>)  
**Impact: ~50–150 ms sequential waterfall; both settings sections blocked on each other**

The page issued two awaits in sequence:

```ts
const { data: club } = await supabase.from('clubs').select('settings')...  // ← blocks
const paceTiersWithUsage = await getPaceTiersWithUsage(membership.club_id); // ← waits for above
```

These queries are fully independent — pace tier usage counts have no dependency on club season settings.

**Fix:** Both queries moved into independent async SCs (`SeasonDatesSectionLoader`, `PaceTiersSectionLoader`), each wrapped in a `<Suspense>` boundary. The page renders the shell immediately; both sections stream in parallel without waiting for each other.

**New files:** [src/components/manage/season-dates-section-loader.tsx](src/components/manage/season-dates-section-loader.tsx), [src/components/manage/pace-tiers-section-loader.tsx](src/components/manage/pace-tiers-section-loader.tsx)

---

### 10. Settings page — connections query blocks preferences cards · **FIXED**

**File:** [src/app/(app)/settings/page.tsx](<src/app/(app)/settings/page.tsx>)  
**Impact: `PreferencesCard` and `NotificationsCard` blocked on `getUserConnections` (third-party OAuth lookup)**

The settings page ran `getUserConnections` (a lookup against stored OAuth tokens for Strava/RideWithGPS) in the same `Promise.all` as the user prefs queries, even though connections are only needed for the integrations card (leader+ only). Third-party OAuth lookups are more variable in latency than local DB queries.

**Fix:** `getUserConnections` removed from the blocking batch. A new `IntegrationsSettingLoader` async SC fetches connections independently, wrapped in `<Suspense>`. Preferences and notifications cards render immediately from the fast 2-query batch.

**New file:** [src/components/settings/integrations-setting-loader.tsx](src/components/settings/integrations-setting-loader.tsx)

---

## Not Fixed (by design) — Streaming

### Ride detail page — signups needed for action bar `isFull` state

The `getRideSignups` result is needed to compute `riderConfirmedCount → availability.isFull → actionBarState`. The sticky action bar is the primary user action surface and must render immediately with correct capacity state. Splitting signups into a streaming section would require a new `getRideConfirmedRiderCount` count query, adding a DB round-trip and complexity for marginal gain. The existing `<Suspense>` on `RideCommentsSection` already covers the below-the-fold streaming win on this page. Left as-is.

### My schedule / manage list pages

`MyScheduleSections`, `MemberList`, `ManageRidesPanel`, and `AnnouncementsPanel` are tab-switching or single-section client components whose parallel data batches are fully coupled — all data is needed before the component can render usefully. Wrapping in a single `<Suspense>` would delay the whole section equally. No streaming benefit. Left as-is.

---

## Updated Summary of Changes

| File                                                                                                               | Change                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [src/app/(app)/page.tsx](<src/app/(app)/page.tsx>)                                                                 | Chain `getNextAvailableRide`; rewritten with 2 Suspense streaming sections                   |
| [src/lib/rides/queries.ts](src/lib/rides/queries.ts)                                                               | Remove per-iteration await in `getUserNextWaitlistedRide`                                    |
| [src/lib/manage/queries.ts](src/lib/manage/queries.ts)                                                             | Wrap `getRecentAnnouncementCount` in `unstable_cache`; switch to admin client                |
| [src/app/(app)/profile/[userId]/page.tsx](<src/app/(app)/profile/[userId]/page.tsx>)                               | Inline `users` fetch; drop stats/recentRides from batch; add streaming slots                 |
| [src/app/(app)/layout.tsx](<src/app/(app)/layout.tsx>)                                                             | Remove `getUserNotifications` from blocking batch; pass `notificationsSlot` RSC slot         |
| [src/app/(app)/manage/page.tsx](<src/app/(app)/manage/page.tsx>)                                                   | Remove blocking `Promise.all`; 2 independent Suspense sections                               |
| [src/app/(app)/profile/page.tsx](<src/app/(app)/profile/page.tsx>)                                                 | Remove stats/recentRides from blocking batch; pass streaming slots to `ProfilePage`          |
| [src/app/(app)/manage/settings/page.tsx](<src/app/(app)/manage/settings/page.tsx>)                                 | Remove 2 sequential awaits; delegate to 2 streaming loaders                                  |
| [src/app/(app)/settings/page.tsx](<src/app/(app)/settings/page.tsx>)                                               | Remove `getUserConnections` from batch; stream `IntegrationsSettingLoader`                   |
| [src/components/layout/header-bar.tsx](src/components/layout/header-bar.tsx)                                       | Replace `notifications`/`unreadNotificationCount` props with `notificationsSlot: ReactNode`  |
| [src/components/layout/app-shell.tsx](src/components/layout/app-shell.tsx)                                         | Thread `notificationsSlot` through to `HeaderBar`                                            |
| [src/components/profile/profile-page.tsx](src/components/profile/profile-page.tsx)                                 | Replace `totalRides`/`ridesThisMonth`/`recentRides` props with `statsSlot`/`recentRidesSlot` |
| [src/components/layout/notifications-loader.tsx](src/components/layout/notifications-loader.tsx)                   | **New** — fetches + renders `NotificationBell`                                               |
| [src/components/dashboard/dashboard-greeting.tsx](src/components/dashboard/dashboard-greeting.tsx)                 | **New** — fetches `full_name`, renders greeting                                              |
| [src/components/dashboard/dashboard-action-content.tsx](src/components/dashboard/dashboard-action-content.tsx)     | **New** — owns all homepage ride queries                                                     |
| [src/components/manage/admin-stats-bento-section.tsx](src/components/manage/admin-stats-bento-section.tsx)         | **New** — fetches + renders stats bento                                                      |
| [src/components/manage/section-cards-section.tsx](src/components/manage/section-cards-section.tsx)                 | **New** — fetches + renders section cards                                                    |
| [src/components/profile/profile-stats-section.tsx](src/components/profile/profile-stats-section.tsx)               | **New** — fetches + renders profile stats bento                                              |
| [src/components/profile/profile-recent-rides-section.tsx](src/components/profile/profile-recent-rides-section.tsx) | **New** — fetches + renders recent rides card                                                |
| [src/components/manage/season-dates-section-loader.tsx](src/components/manage/season-dates-section-loader.tsx)     | **New** — fetches club settings, renders `SeasonDatesSection`                                |
| [src/components/manage/pace-tiers-section-loader.tsx](src/components/manage/pace-tiers-section-loader.tsx)         | **New** — fetches pace tier usage, renders `PaceTiersSection`                                |
| [src/components/settings/integrations-setting-loader.tsx](src/components/settings/integrations-setting-loader.tsx) | **New** — fetches connections, renders `IntegrationsSetting`                                 |

---

## Third Audit — Re-Audit

**Date:** April 14, 2026

Re-ran the full performance audit checklist against the current codebase. All fixes from the first two audits remain intact. Three new improvements applied; no critical issues found.

---

### 11. Font `display: 'swap'` missing — **FIXED**

**File:** [src/app/layout.tsx](src/app/layout.tsx)
**Impact: FOIT (Flash of Invisible Text) on every page load — affects LCP and FCP**

Both `Outfit` and `DM_Sans` font declarations lacked `display: 'swap'`, causing the browser to hide text until the web font downloads. This directly delays Largest Contentful Paint on text-heavy pages.

**Fix:** Added `display: 'swap'` to both font declarations. Text now renders immediately in a fallback system font, then swaps to the web font once loaded.

---

### 12. `optimizePackageImports` not configured — **FIXED**

**File:** [next.config.ts](next.config.ts)
**Impact: Safety net for tree-shaking `@phosphor-icons/react` and `date-fns`**

Added `experimental.optimizePackageImports` for `@phosphor-icons/react` and `date-fns`. While Phosphor icons were already imported via `/dist/ssr` deep paths and Turbopack already tree-shakes well, this ensures any future barrel imports are automatically optimized.

---

### 13. Mapbox GL CSS imported twice — **FIXED**

**Files:** [src/components/rides/route-map.tsx](src/components/rides/route-map.tsx), [src/components/rides/location-map.tsx](src/components/rides/location-map.tsx)
**Impact: Code hygiene — bundler deduplicates in production, but canonical single source is cleaner**

Both map components independently imported `mapbox-gl/dist/mapbox-gl.css`. Extracted to a shared [src/components/rides/map-styles.ts](src/components/rides/map-styles.ts) file; both components now import from there.

---

## Bundle Size Analysis

**Build:** Next.js 16.2.3 (Turbopack) — `@next/bundle-analyzer` is webpack-only and incompatible with Turbopack. Sizes measured from `.next/static/chunks/` output.

| Metric        | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Total JS      | 4.6MB                                                                                      |
| Total CSS     | 196KB                                                                                      |
| Largest chunk | 1.7MB (mapbox-gl — behind `dynamic()` with `ssr: false`, only loaded on ride detail pages) |

**JS chunks > 100KB:**

| Size  | Contents                                                 |
| ----- | -------------------------------------------------------- |
| 1.7MB | mapbox-gl (dynamically imported, ride detail pages only) |
| 223KB | Mapbox buffer utilities (co-loaded with mapbox-gl)       |
| 222KB | Next.js framework runtime                                |
| 135KB | React + React DOM runtime                                |
| 110KB | Framer Motion (used across nav, transitions, animations) |
| 106KB | Application shared chunk                                 |

All large chunks are either framework runtime (unavoidable) or behind dynamic imports (mapbox). No actionable bundle size issues.

---

## Full Checklist Status

### Confirmed Good

| Area                                                       | Status                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `React.cache()` on `createClient` and `getUser`            | Correct — one auth call per request                                 |
| `unstable_cache` with typed cache tags on all hot paths    | Consistent                                                          |
| Parallel fetches with `Promise.all`                        | Used throughout — no sequential waterfalls                          |
| Suspense boundaries with streaming                         | All major pages: dashboard, profile, manage, settings               |
| `loading.tsx` files with matching skeletons                | Present on all dynamic routes                                       |
| Phosphor icons via `/dist/ssr` (tree-shaken)               | Correct                                                             |
| `next/image` used for all images (no raw `<img>`)          | Correct                                                             |
| `next/font` with subset + specific weights                 | Correct — 2 families (Outfit, DM Sans), latin subset                |
| Font `display: 'swap'`                                     | **Now set** (fixed in this audit)                                   |
| `optimizePackageImports`                                   | **Now configured** (fixed in this audit)                            |
| Dynamic import for mapbox (`ssr: false`)                   | Correct — `RouteMapLoader` uses `dynamic()`                         |
| No barrel file import issues                               | Verified                                                            |
| Optimistic updates in mutations                            | `card-signup-button.tsx` uses `useTransition` + optimistic state    |
| Reduced-motion respected                                   | `useReducedMotion()` checked in all animation components            |
| Lean context providers (4 total)                           | ThemeProvider, UserPrefsProvider, NavigationOriginProvider, Toaster |
| Middleware (proxy) — no DB calls, matcher excludes statics | Session refresh only; fast-path returns for localhost and marketing |
| No `force-dynamic` directives                              | Verified — all pages use default caching                            |
| No client-side fetching for server-fetchable data          | All data fetching in server components                              |
| `<Link>` used for all internal navigation                  | Verified — no raw `<a>` tags for in-app routes                      |
| `lottie-react` removed                                     | Confirmed removed (commit 0700140)                                  |
| Analytics (Vercel) only on marketing routes                | Correct — not in authenticated app routes                           |

### Not Applicable / Deferred

| Area                        | Reason                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| PPR (Partial Prerendering)  | Not yet stable for production use in Next.js 16                                             |
| `generateStaticParams`      | All dynamic routes are auth-gated; static generation not applicable                         |
| Avatar `priority` prop      | Header avatar uses Base UI `AvatarPrimitive.Image` (not `next/image`); not LCP element      |
| Speculation Rules API       | Chrome-only; app is SPA with client-side routing; limited benefit                           |
| `@next/bundle-analyzer`     | Webpack-only; incompatible with Turbopack. Chunk sizes inspected directly from build output |
| Edge runtime for API routes | Supabase client requires Node.js runtime; edge not compatible                               |

---

## Summary of Changes (This Audit)

| File                                                                           | Change                                            |
| ------------------------------------------------------------------------------ | ------------------------------------------------- |
| [src/app/layout.tsx](src/app/layout.tsx)                                       | Add `display: 'swap'` to Outfit and DM Sans fonts |
| [next.config.ts](next.config.ts)                                               | Add `experimental.optimizePackageImports`         |
| [src/components/rides/map-styles.ts](src/components/rides/map-styles.ts)       | **New** — shared Mapbox GL CSS import             |
| [src/components/rides/route-map.tsx](src/components/rides/route-map.tsx)       | Import CSS from shared `map-styles.ts`            |
| [src/components/rides/location-map.tsx](src/components/rides/location-map.tsx) | Import CSS from shared `map-styles.ts`            |
