# Framer Motion Audit

Full inventory of every file that imports from `framer-motion` as of April 2026.

---

## Motion utility library

### `src/lib/motion.ts`

Central source of truth. Not a component — exports shared constants and helpers used everywhere else.

| Export               | Type          | Purpose                                                 |
| -------------------- | ------------- | ------------------------------------------------------- |
| `DURATIONS`          | const         | Second values mirroring `--duration-*` CSS tokens       |
| `EASE`               | const         | Bezier arrays mirroring `--ease-*` CSS tokens           |
| `SPRINGS`            | const         | Spring presets: `snappy`, `gentle`, `bouncy`            |
| `fadeSlideUp`        | Variants      | Fade + 8px rise; used for list items and panel entries  |
| `fadeScale`          | Variants      | Fade + 0.94 scale; used for badges and popovers         |
| `skeletonItem`       | Variants      | Fade + 6px rise + 0.98 scale; skeleton materialise feel |
| `listItem`           | Variants      | Fade + rise in, slide-left out; for reorderable rows    |
| `staggerContainer()` | fn → Variants | Container that staggers children; configurable delay    |
| `useMotionPresets()` | hook          | Returns reduced-motion-aware resolved variants          |

Framer imports: `useReducedMotion`, `Transition`, `Variants`

---

## Motion hooks

### `src/hooks/use-edge-swipe.ts`

iOS-style edge-swipe-back gesture.  
Uses `useMotionValue` to expose an `x` value that is bound directly to the page wrapper's `style.x` (drives the swipe drag transform), plus `animate` to spring the value back on cancel. `useReducedMotion` disables the spring-back animation.

Framer imports: `animate`, `useMotionValue`, `useReducedMotion`

---

## Dedicated motion components (`src/components/motion/`)

### `skeleton-group.tsx`

Wraps skeleton placeholder blocks in a staggered entrance animation. Each child fades and rises sequentially instead of all appearing at once.

- Container: `motion.div` with `staggerContainer` variants
- Each child: `motion.div` with `skeletonItem` variant (via `useMotionPresets`)
- Respects `prefers-reduced-motion` via `useMotionPresets`

Framer imports: `motion`

---

### `content-transition.tsx`

Fade-and-rise entrance for real content replacing a skeleton inside a `Suspense` boundary. Prevents a hard visual pop on data resolution.

- Single `motion.div`: `opacity 0→1`, `y 6→0`
- Reduced motion: `initial={false}`, zero-duration transition

Framer imports: `motion`, `useReducedMotion`

---

### `inline-edit-transition.tsx`

Crossfade + height collapse between an inline edit form and its read-only view. Used by all profile and manage section inline editors.

- `AnimatePresence mode="wait"` keyed on `editing` boolean
- `motion.div`: animates `opacity` + `height 0→auto`
- Reduced motion: opacity-only, `height` kept static

Framer imports: `AnimatePresence`, `motion`, `useReducedMotion`

---

### `animated-counter.tsx`

Tweens a number from its previous value to a new one on each render. Used for stats that update (e.g. member counts, ride counts).

- `useMotionValue` + `animate` drive the tween
- `onUpdate` callback formats and sets display string via `useState`
- Reduced motion: snaps instantly with `requestAnimationFrame` tick

Framer imports: `animate`, `useMotionValue`, `useReducedMotion`

---

## Layout components

### `src/components/layout/page-transition-wrapper.tsx`

Directional slide animation for page navigation on mobile. Forward navigation slides in from right; back slides from left. Also integrates edge-swipe gesture (`use-edge-swipe`).

- `motion.div` with `style={{ x }}` bound to the swipe motion value
- CSS class-based slide animation for route changes (not Framer variants)
- No animation on desktop; no animation on initial load

Framer imports: `motion`

---

### `src/components/layout/bottom-nav.tsx`

Mobile bottom tab bar with a spring-animated active-state indicator.

- `LayoutGroup id="bottom-nav"` coordinates shared layout animations
- `MotionLink = motion.create(Link)` — each tab item is a motion component
- `whileTap={{ scale: 0.91 }}` with `SPRINGS.gentle` for press feedback
- Active indicator uses `layoutId` for shared-element spring between tabs
- Reduced motion: `whileTap` removed

Framer imports: `LayoutGroup`, `motion`, `useReducedMotion`

---

### `src/components/layout/notification-bell.tsx`

Notification badge + popover in the app header.

- `AnimatePresence` wraps the unread badge so it animates in/out
- `motion.span` for the badge: `fadeScale` variant (fade + 0.94 scale)
- Reduced motion: collapses scale transform to opacity-only

Framer imports: `AnimatePresence`, `motion`, `useReducedMotion`

---

## UI components

### `src/components/ui/segmented-control.tsx`

iOS-style mutually-exclusive option picker. The active selection pill slides between segments with a damped spring.

- `motion` element with `layoutId` for the sliding pill
- Custom spring: `stiffness: 500`, `damping: 40`, `mass: 0.8`

Framer imports: `motion`, `Transition`

---

### `src/components/ui/empty-state.tsx`

Empty/zero-state UI block with animated entrance.

- Outer `motion.div`: 0.94 scale + fade in (`SPRINGS.out`)
- Icon container `motion.div`: 0.8→1 scale spring pop with 100ms delay
- Reduced motion: scale collapsed to opacity-only on both elements

Framer imports: `motion`, `useReducedMotion`

---

## Dashboard components

### `src/components/dashboard/stats-bento.tsx`

Staggered entrance for the metrics grid on the member dashboard.

- Container `motion.div` with inline stagger variants
- Each metric `motion.div`: `opacity 0→1`, `y 12→0`
- Reduced motion: stagger collapsed to 0, `y` removed

Framer imports: `motion`, `useReducedMotion`

---

### `src/components/dashboard/action-bar.tsx`

"Your next ride" and "Ride you're leading" cards on the dashboard.

- Two `motion.div` wrappers: fade + slide-up entrance (`opacity 0→1`, `y 16→0`)
- Each uses `DURATIONS.normal` + `EASE.out`
- Reduced motion: `y` transform collapsed to opacity only

Framer imports: `motion`, `useReducedMotion`

---

## Manage components

### `src/components/manage/manage-stats-bento.tsx`

Stats bento grid on the manage dashboard — mirrors the member `stats-bento` pattern.

- Container `motion.div` with `staggerContainer` and `fadeSlideUp` children
- Three child `motion.div` panels using `fadeSlideUp` variant
- No explicit reduced-motion handling (uses CSS `prefers-reduced-motion` fallback)

Framer imports: `motion`

---

### `src/components/manage/pace-tiers-section.tsx`

Pace group management table with expandable rows.

- `AnimatePresence initial={false}` wraps the table body
- `motion.tr` for each pace tier row: enter/exit with `fadeSlideUp` / `listItem` variants
- Expanded sub-rows also use `motion.tr` within a nested `AnimatePresence`

Framer imports: `AnimatePresence`, `motion`

---

### `src/components/manage/announcements-panel.tsx`

Announcement list and create/edit form panel.

- `AnimatePresence initial={false}` wraps the announcement list
- Individual announcement items use `motion` for enter/exit transitions
- Create/edit panel toggle uses `AnimatePresence` for mount/unmount

Framer imports: `AnimatePresence`, `motion`

---

### `src/components/manage/member-list.tsx`

Member management table with status-based rows.

- `AnimatePresence initial={false}` wraps the full member list
- `motion` elements for individual member rows: enter with `listItem` variant, exit slides left
- Large list — `AnimatePresence` covers ~180 lines of rendered rows

Framer imports: `AnimatePresence`, `motion`

---

## Rides components

### `src/components/rides/filterable-ride-feed.tsx`

Rides list with pace-group filter chips.

- `AnimatePresence initial={false} mode="popLayout"` wraps filtered ride cards
- Each `RideCard` is a `motion.div` with `listItem` variant
- Container uses `staggerContainer` variant from `@/lib/motion`
- Reduced motion: stagger → 0, `y` transform removed

Framer imports: `AnimatePresence`, `motion`, `useReducedMotion`

---

### `src/components/rides/signup-roster.tsx`

Ride signup roster showing confirmed and waitlisted riders.

- Four separate `AnimatePresence initial={false} mode="popLayout"` blocks:
  - Confirmed riders list
  - Waitlisted riders list
  - Current user's confirmed row
  - Current user's waitlist row
- Each rider avatar/row is a `motion` element with `listItem` variant

Framer imports: `AnimatePresence`, `motion`

---

### `src/components/rides/ride-comments.tsx`

Comment thread on a ride detail page.

- `AnimatePresence initial={false}` wraps the comment list
- Each comment is a `motion` element: fade + slide-up on enter, fade on exit

Framer imports: `AnimatePresence`, `motion`

---

## Profile components

### `src/components/profile/profile-avatar-editor.tsx`

Avatar upload and remove UI.

- `AnimatePresence mode="popLayout" initial={false}` wraps the avatar image
- `motion` element for the avatar preview: crossfades between old/new image on upload
- Uses `DURATIONS.normal` + `EASE.out`

Framer imports: `AnimatePresence`, `motion`

---

## App pages

### `src/app/(app)/my-rides/my-schedule-sections.tsx`

"My schedule" sections (upcoming / past rides) on the My Rides page.

- Container `motion.div` with `staggerContainer` variants
- Each ride `motion.div`: `listItem` variant (fade + rise in, slide-left out)
- `AnimatePresence initial={false} mode="popLayout"` for list item exit animations
- Reduced motion: stagger → 0, transforms collapsed

Framer imports: `AnimatePresence`, `motion`, `useReducedMotion`

---

## Summary table

| File                                                | APIs used                                       | Pattern                     |
| --------------------------------------------------- | ----------------------------------------------- | --------------------------- |
| `src/lib/motion.ts`                                 | `useReducedMotion`                              | Utility library             |
| `src/hooks/use-edge-swipe.ts`                       | `animate`, `useMotionValue`, `useReducedMotion` | Gesture x-axis drag         |
| `src/components/motion/skeleton-group.tsx`          | `motion`                                        | Staggered skeleton entrance |
| `src/components/motion/content-transition.tsx`      | `motion`, `useReducedMotion`                    | Skeleton→content fade       |
| `src/components/motion/inline-edit-transition.tsx`  | `AnimatePresence`, `motion`, `useReducedMotion` | View↔edit height crossfade  |
| `src/components/motion/animated-counter.tsx`        | `animate`, `useMotionValue`, `useReducedMotion` | Numeric tween               |
| `src/components/layout/page-transition-wrapper.tsx` | `motion`                                        | Mobile page slide + swipe   |
| `src/components/layout/bottom-nav.tsx`              | `LayoutGroup`, `motion`, `useReducedMotion`     | Tab indicator spring slide  |
| `src/components/layout/notification-bell.tsx`       | `AnimatePresence`, `motion`, `useReducedMotion` | Badge fade-scale            |
| `src/components/ui/segmented-control.tsx`           | `motion`, `Transition`                          | Active pill spring slide    |
| `src/components/ui/empty-state.tsx`                 | `motion`, `useReducedMotion`                    | Scale + fade entrance       |
| `src/components/dashboard/stats-bento.tsx`          | `motion`, `useReducedMotion`                    | Staggered metrics grid      |
| `src/components/dashboard/action-bar.tsx`           | `motion`, `useReducedMotion`                    | Ride card fade-slide        |
| `src/components/manage/manage-stats-bento.tsx`      | `motion`                                        | Staggered stat panels       |
| `src/components/manage/pace-tiers-section.tsx`      | `AnimatePresence`, `motion`                     | Table row enter/exit        |
| `src/components/manage/announcements-panel.tsx`     | `AnimatePresence`, `motion`                     | List item enter/exit        |
| `src/components/manage/member-list.tsx`             | `AnimatePresence`, `motion`                     | Member row enter/exit       |
| `src/components/rides/filterable-ride-feed.tsx`     | `AnimatePresence`, `motion`, `useReducedMotion` | Filtered list with stagger  |
| `src/components/rides/signup-roster.tsx`            | `AnimatePresence`, `motion`                     | Roster row enter/exit (×4)  |
| `src/components/rides/ride-comments.tsx`            | `AnimatePresence`, `motion`                     | Comment enter/exit          |
| `src/components/profile/profile-avatar-editor.tsx`  | `AnimatePresence`, `motion`                     | Avatar crossfade on upload  |
| `src/app/(app)/my-rides/my-schedule-sections.tsx`   | `AnimatePresence`, `motion`, `useReducedMotion` | Staggered schedule list     |

**22 files total** — 1 utility library, 1 hook, 4 dedicated motion components, 17 feature components/pages.

### Framer Motion API surface in use

| API                 | # files |
| ------------------- | ------- |
| `motion` (elements) | 19      |
| `AnimatePresence`   | 12      |
| `useReducedMotion`  | 11      |
| `useMotionValue`    | 2       |
| `animate`           | 2       |
| `LayoutGroup`       | 1       |
| `Transition` (type) | 1       |
| `Variants` (type)   | 1       |
