import type { ReactNode } from 'react';

/**
 * FloatingActionBar — shared primitive for pages that need a persistent
 * Save/Cancel bar pinned to the bottom of the viewport.
 *
 * Two presentations are rendered simultaneously, switched via `md:`:
 *   - Mobile: fixed to the bottom of the viewport, pill-shaped with glass blur
 *     and safe-area padding.
 *   - Desktop: fixed-bottom, centred, constrained to max content width.
 *
 * Styling is driven entirely by CSS custom properties defined in
 * src/app/globals.css (`--bar-inset-x`, `--bar-radius`, `--bar-bg-opacity`,
 * `--bar-shadow`, `--bar-backdrop-blur`, etc.) so both the ride form and the
 * profile edit mode stay in lockstep.
 */
export function FloatingActionBar({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Mobile — fixed bottom, pill-shaped, glass/blur */}
      <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-[max(var(--bar-inset-x),env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-lg md:hidden">
        <div className="rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) px-(--bar-padding-x-action) py-(--bar-padding-y) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur)">
          {children}
        </div>
      </div>

      {/* Desktop — static, below last section card */}
      <div className="hidden rounded-(--bar-radius-desktop) border border-border/20 bg-surface-default/(--bar-bg-opacity) px-(--bar-padding-x-desktop) py-(--bar-padding-y-desktop) shadow-(--bar-shadow-desktop) backdrop-blur-(--bar-backdrop-blur) md:block">
        {children}
      </div>
    </>
  );
}
