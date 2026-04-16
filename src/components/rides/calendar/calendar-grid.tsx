'use client';

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday as dateIsToday,
  getDate,
} from 'date-fns';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';
import { appContent } from '@/content/app';
import { CalendarDayCell } from './calendar-day-cell';
import type { CalendarRide } from '@/lib/rides/queries';

const { calendar: content } = appContent;

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  monthRides: CalendarRide[];
  direction: number;
  onSelectDate: (date: Date) => void;
}

/** Map rides by date string for O(1) lookup. */
function groupRidesByDate(rides: CalendarRide[]): Map<string, CalendarRide[]> {
  const map = new Map<string, CalendarRide[]>();
  for (const ride of rides) {
    const existing = map.get(ride.ride_date);
    if (existing) {
      existing.push(ride);
    } else {
      map.set(ride.ride_date, [ride]);
    }
  }
  return map;
}

/** Convert JS getDay (0=Sun) to Monday-first index (0=Mon). */
function mondayIndex(date: Date): number {
  return (getDay(date) + 6) % 7;
}

/** Format date as YYYY-MM-DD for ride lookup. */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASE.out },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASE.out },
  }),
};

export function CalendarGrid({
  currentMonth,
  selectedDate,
  monthRides,
  direction,
  onSelectDate,
}: CalendarGridProps) {
  const shouldReduce = useReducedMotion();
  const ridesByDate = groupRidesByDate(monthRides);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty cells (Mon=0, so if month starts on Wed, 2 empty cells)
  const leadingBlanks = mondayIndex(monthStart);

  // Key for AnimatePresence — unique per month
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  return (
    <div className="mt-3">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {content.weekdays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells — animated on month change */}
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={monthKey}
          custom={direction}
          variants={shouldReduce ? undefined : slideVariants}
          initial={shouldReduce ? { opacity: 0 } : 'enter'}
          animate={shouldReduce ? { opacity: 1 } : 'center'}
          exit={shouldReduce ? { opacity: 0 } : 'exit'}
          className="grid grid-cols-7"
        >
          {/* Leading blanks */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {/* Day cells */}
          {days.map((date) => {
            const dateKey = toDateKey(date);
            const dayRides = ridesByDate.get(dateKey) ?? [];
            const isUserDay = dayRides.some((r) => r.user_has_signup || r.user_is_leader);

            return (
              <CalendarDayCell
                key={dateKey}
                date={date}
                dayNumber={getDate(date)}
                rides={dayRides}
                isToday={dateIsToday(date)}
                isSelected={selectedDate !== null && isSameDay(date, selectedDate)}
                isCurrentMonth={true}
                isUserDay={isUserDay}
                onClick={() => onSelectDate(date)}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
