'use client';

import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday as dateIsToday,
  getDate,
  subDays,
  addDays,
  isSameMonth,
  startOfDay,
} from 'date-fns';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE } from '@/lib/motion';
import { appContent } from '@/content/app';
import { CalendarDayCell } from './calendar-day-cell';
import type { CalendarRide } from '@/lib/rides/queries';

const { calendar: content } = appContent;

/** Total cells in the grid — 6 weeks × 7 days. Fixed height avoids layout shift between months. */
const GRID_CELLS = 42;
const DAYS_PER_WEEK = 7;
const WEEK_COUNT = 6;

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date;
  monthRides: CalendarRide[];
  direction: number;
  onSelectDate: (date: Date) => void;
}

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
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const leadingCount = mondayIndex(monthStart);
  const leadingDays: Date[] = [];
  for (let i = leadingCount; i > 0; i--) {
    leadingDays.push(subDays(monthStart, i));
  }

  const trailingCount = GRID_CELLS - leadingCount - monthDays.length;
  const trailingDays: Date[] = [];
  for (let i = 1; i <= trailingCount; i++) {
    trailingDays.push(addDays(monthEnd, i));
  }

  const allDays = [...leadingDays, ...monthDays, ...trailingDays];

  // Build up to 6 rows, then drop any trailing row whose cells are entirely
  // next-month days — iOS Calendar omits that phantom row and so do we.
  const rows: Date[][] = [];
  for (let w = 0; w < WEEK_COUNT; w++) {
    const rowDays = allDays.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK);
    if (rowDays.some((d) => isSameMonth(d, currentMonth))) {
      rows.push(rowDays);
    }
  }

  const todayStart = startOfDay(new Date());
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  return (
    <div className="mt-4">
      <div className="mb-1 grid grid-cols-7">
        {content.weekdays.map((day, i) => (
          <div
            key={i}
            className="text-center font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={monthKey}
          custom={direction}
          variants={shouldReduce ? undefined : slideVariants}
          initial={shouldReduce ? { opacity: 0 } : 'enter'}
          animate={shouldReduce ? { opacity: 1 } : 'center'}
          exit={shouldReduce ? { opacity: 0 } : 'exit'}
          className="overflow-hidden"
        >
          {rows.map((rowDays, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7">
              {rowDays.map((date) => {
                const dateKey = toDateKey(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const dayRides = isCurrentMonth ? (ridesByDate.get(dateKey) ?? []) : [];
                const isUserDay = dayRides.some((r) => r.user_has_signup || r.user_is_leader);
                const isToday = dateIsToday(date);
                const isSelected = isSameDay(date, selectedDate);
                const isFilled = isCurrentMonth && isSelected;
                const isPast = startOfDay(date) < todayStart;

                return (
                  <CalendarDayCell
                    key={dateKey}
                    date={date}
                    dayNumber={getDate(date)}
                    rides={dayRides}
                    isToday={isToday}
                    isSelected={isSelected}
                    isCurrentMonth={isCurrentMonth}
                    isUserDay={isUserDay}
                    isPast={isPast}
                    isFilled={isFilled}
                    onClick={() => onSelectDate(date)}
                  />
                );
              })}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
