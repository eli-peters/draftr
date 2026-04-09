import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * ActionBar — the single primitive for every bottom-pinned dynamic action bar
 * in the app (ride detail signup, ride form save, profile edit save, …).
 *
 * Rulebook:
 *
 * 1. **When it shows** — callers only mount this when an action is available.
 *    The primitive itself is dumb; there are no empty / placeholder states.
 *
 * 2. **Mobile** — fixed to the viewport bottom, pill-shaped, glass blur, safe
 *    area aware, `max-w-lg` centered. Uses the omni-directional floating
 *    shadow because it sits over content.
 *
 * 3. **Desktop** — sticky at the bottom of the content column, spanning the
 *    full container width, same pill radius as mobile, directional shadow.
 *    Living inside the content column means it naturally respects the
 *    sidebar offset and only pins while the current page is in view.
 *
 * 4. **Two-zone layout** — `left` is for secondary content (avatar stacks,
 *    prompts, discard buttons); `right` is for the primary / destructive CTA.
 *    Destructive confirm is always preceded by a ghost dismiss. Pass
 *    `children` to escape the two-zone layout for custom content.
 *
 * 5. **Mode transitions** — when `transitioning` is true, the body clips to
 *    `max-h-24` so consumers can morph between modes (e.g. idle ↔
 *    confirm-leave) without remount flicker.
 *
 * 6. **Content padding** — pages rendering an ActionBar are responsible for
 *    adding bottom padding to their content so the bar never occludes the
 *    last section. Use `pb-32 md:pb-24` (≈ `--bar-min-height` + insets).
 *
 * All styling is driven by `--bar-*` custom properties in globals.css.
 */
interface ActionBarProps {
  /** Left zone — avatar stack, prompt text, secondary button. */
  left?: ReactNode;
  /** Right zone — primary / destructive CTA (or a row of them). */
  right?: ReactNode;
  /** Escape hatch — takes precedence over `left`/`right` when provided. */
  children?: ReactNode;
  /** Enables the max-height clip transition for mode morphs. */
  transitioning?: boolean;
  className?: string;
}

export function ActionBar({
  left,
  right,
  children,
  transitioning = false,
  className,
}: ActionBarProps) {
  return (
    <div
      className={cn(
        // Mobile: fixed to viewport bottom, pill, max-w-lg centered, safe area.
        'fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-(--bar-inset-bottom) z-40 mx-auto max-w-lg',
        // Desktop: sticky at bottom of content column, full container width.
        'md:sticky md:inset-x-auto md:bottom-(--bar-inset-x) md:mx-0 md:max-w-none',
        className,
      )}
    >
      <div
        className={cn(
          // Body chrome — fixed-height pill so the bar never shifts between states.
          'flex h-(--bar-min-height) items-center rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) px-(--bar-padding-x-action) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur)',
          'md:px-(--bar-padding-x-desktop) md:shadow-(--bar-shadow-desktop)',
          transitioning &&
            'transition-[background-color] duration-[--duration-normal] ease-[--ease-out]',
        )}
      >
        {children ?? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="min-w-0 flex-1">{left}</div>
            {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
