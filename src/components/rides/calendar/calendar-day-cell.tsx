'use client';

import { cn } from '@/lib/utils';
import type { CalendarRide } from '@/lib/rides/queries';

/** Maximum visible dots per cell before showing overflow. */
const MAX_DOTS = 3;

interface CalendarDayCellProps {
  date: Date;
  dayNumber: number;
  rides: CalendarRide[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isUserDay: boolean;
  /** True for any date strictly before today — markers render in a muted "history" tone. */
  isPast: boolean;
  /**
   * True when this cell is the one carrying the filled-circle selection
   * treatment — either because the user tapped it, or because it is today
   * and no other date is explicitly selected.
   */
  isFilled: boolean;
  onClick: () => void;
}

/**
 * Individual day cell in the calendar grid.
 *
 * State model — iOS-native restraint:
 * - The filled primary circle always marks the currently-selected date.
 *   On load it lands on today; tapping elsewhere transfers the fill.
 * - Today-when-unselected falls back to primary text (no fill).
 * - User-day (signed up / leader) is marked by a 2px bar below the digit
 *   and, when a user-pace ride exists, by a primary-coloured pace dot.
 * - Out-of-month days are shown at muted weight for spatial context; they
 *   are non-interactive and carry no ride indicators.
 *
 * Ride representation — dots vs. truncated text pills:
 * - Active: pace-coloured dots under each date.
 * - Considered: truncated text pills inside each cell (Figma reference at
 *   node 2029:2710). Rejected because at 7 columns on a mobile viewport each
 *   cell is ~50px wide — any ride title truncates to 4-5 characters ("Satu…",
 *   "Inter…") which is worthless. A rider scanning the calendar needs to
 *   answer "is there a ride that day, and what pace?" — dots answer both in
 *   3mm of space; text pills answer neither at this width. Pills also force a
 *   ~3× taller grid, pushing the agenda below the fold.
 * - Revisit if: we add a desktop-only wide calendar layout, or we decide the
 *   calendar should double as a ride-title browser (which is what the agenda
 *   zone is for).
 */
export function CalendarDayCell({
  dayNumber,
  rides,
  isToday,
  isSelected,
  isCurrentMonth,
  isUserDay,
  isPast,
  isFilled,
  onClick,
}: CalendarDayCellProps) {
  const userPaceOrders = new Set(
    rides
      .filter((r) => r.user_has_signup || r.user_is_leader)
      .map((r) => r.pace_group_sort_order)
      .filter((x): x is number => x !== null),
  );

  // Dedupe pace groups then sort so the user's own pace groups land first —
  // guarantees the primary dot is visible even if there are >3 pace groups.
  const sortedPaceOrders = [
    ...new Set(rides.map((r) => r.pace_group_sort_order).filter((x): x is number => x !== null)),
  ].sort((a, b) => {
    const aIsUser = userPaceOrders.has(a);
    const bIsUser = userPaceOrders.has(b);
    if (aIsUser && !bIsUser) return -1;
    if (!aIsUser && bIsUser) return 1;
    return a - b;
  });
  const visibleDots = sortedPaceOrders.slice(0, MAX_DOTS);
  const overflowCount = sortedPaceOrders.length - MAX_DOTS;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-0.5 py-1.5 transition-colors',
        'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      aria-label={`${dayNumber}`}
      aria-pressed={isSelected}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums transition-colors',
          isFilled && 'bg-primary text-primary-foreground font-semibold',
          !isFilled && isToday && isCurrentMonth && 'text-primary font-semibold',
          !isFilled && !isToday && isCurrentMonth && 'text-foreground group-hover:bg-accent',
          !isCurrentMonth && 'text-muted-foreground',
        )}
      >
        {dayNumber}
      </span>

      {/* User-day underline — always reserves vertical space for layout consistency. Muted for past dates. */}
      <span
        aria-hidden
        className={cn(
          'h-0.5 w-3 rounded-full',
          isUserDay && isCurrentMonth
            ? isPast
              ? 'bg-accent-neutral-muted'
              : 'bg-primary'
            : 'bg-transparent',
        )}
      />

      <div className="mt-0.5 flex h-2 items-center gap-1">
        {visibleDots.map((sortOrder) => {
          const isUserPace = userPaceOrders.has(sortOrder);
          return (
            <span
              key={sortOrder}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isUserPace && !isPast ? 'bg-accent-primary-default' : 'bg-accent-neutral-muted',
                !isCurrentMonth && 'opacity-50',
                isPast && isCurrentMonth && 'opacity-60',
              )}
            />
          );
        })}
        {overflowCount > 0 && (
          <span
            className={cn(
              'text-[8px] leading-none font-medium text-muted-foreground',
              !isCurrentMonth && 'opacity-50',
              isPast && isCurrentMonth && 'opacity-60',
            )}
          >
            +{overflowCount}
          </span>
        )}
      </div>
    </button>
  );
}
