'use client';

import { cn } from '@/lib/utils';
import type { CalendarRide } from '@/lib/rides/queries';

/**
 * Pace-group dot color mapping — uses the badge-pace semantic tokens.
 * sort_order 1–6 maps to pace-1 through pace-6 background token.
 */
function dotColorClass(sortOrder: number): string {
  const slot = Math.min(Math.max(sortOrder, 1), 6);
  return `bg-badge-pace-${slot}-text`;
}

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
  onClick: () => void;
}

/**
 * Individual day cell in the calendar grid.
 *
 * Displays:
 * - Date number with visual treatment for today and "day is yours"
 * - Up to 3 colored dots per pace group with rides that day
 * - Overflow indicator for 4+ pace groups
 *
 * "Day is yours" treatment:
 * - Option A (active): Hollow ring in primary around the date digit
 * - Option B (alternative): Soft filled pill behind the date digit — more presence,
 *   more visually grabby. Swap by replacing the ring classes with:
 *   `bg-primary/12 text-primary font-semibold` on the date span.
 */
export function CalendarDayCell({
  dayNumber,
  rides,
  isToday,
  isSelected,
  isCurrentMonth,
  isUserDay,
  onClick,
}: CalendarDayCellProps) {
  // Dedupe pace groups — one dot per unique sort_order
  const uniquePaceOrders = [...new Set(rides.map((r) => r.pace_group_sort_order).filter(Boolean))];
  const visibleDots = uniquePaceOrders.slice(0, MAX_DOTS);
  const overflowCount = uniquePaceOrders.length - MAX_DOTS;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 py-1.5 transition-colors',
        'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !isCurrentMonth && 'opacity-30',
        isSelected && !isToday && 'bg-accent',
      )}
      aria-label={`${dayNumber}`}
      aria-pressed={isSelected}
    >
      {/* Date number */}
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums',
          // Today marker — filled primary circle
          isToday && 'bg-primary text-primary-foreground font-semibold',
          // Option A: "Day is yours" — hollow ring in primary (not applied if today)
          !isToday && isUserDay && 'ring-2 ring-primary text-primary font-medium',
          // Default
          !isToday && !isUserDay && 'text-foreground',
        )}
      >
        {dayNumber}
      </span>

      {/* Pace group dots */}
      <div className="flex h-2 items-center gap-0.5">
        {visibleDots.map((sortOrder) => (
          <span
            key={sortOrder}
            className={cn('h-1.5 w-1.5 rounded-full', dotColorClass(sortOrder as number))}
          />
        ))}
        {overflowCount > 0 && (
          <span className="text-[8px] leading-none font-medium text-muted-foreground">
            +{overflowCount}
          </span>
        )}
      </div>
    </button>
  );
}
