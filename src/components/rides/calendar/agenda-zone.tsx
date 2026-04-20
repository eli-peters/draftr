'use client';

import { format } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/motion';
import { RideCard } from '@/components/rides/ride-card';
import { appContent } from '@/content/app';
import { dateFormats, parseLocalDate } from '@/config/formatting';
import type { RideWithDetails } from '@/types/database';

/**
 * Compact ride-count pill. Primary-tinted to echo the filled selected-date circle.
 * Restrained on purpose — just the digit, no unit noise, tabular-nums for alignment.
 */
function RideCountPill({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} rides`}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-action-primary-subtle-bg px-1.5 font-sans text-xs font-semibold text-action-primary-subtle-text tabular-nums"
    >
      {count}
    </span>
  );
}

const { calendar: calendarContent } = appContent;

interface AgendaZoneProps {
  rides: RideWithDetails[];
  selectedDate: Date;
  timezone: string;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AgendaZone({ rides, selectedDate, timezone }: AgendaZoneProps) {
  const shouldReduce = useReducedMotion();

  const anchorKey = toDateKey(selectedDate);

  const groups = new Map<string, RideWithDetails[]>();
  for (const ride of rides) {
    const existing = groups.get(ride.ride_date);
    if (existing) existing.push(ride);
    else groups.set(ride.ride_date, [ride]);
  }
  if (!groups.has(anchorKey)) {
    groups.set(anchorKey, []);
  }
  const orderedKeys = [...groups.keys()].sort();

  return (
    <section className="mt-6 flex flex-col gap-6">
      {orderedKeys.map((dateKey) => {
        const groupRides = groups.get(dateKey) ?? [];
        const date = parseLocalDate(dateKey);
        const heading = format(date, dateFormats.dayLong);
        const isEmpty = groupRides.length === 0;
        return (
          <div key={dateKey} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 py-1 font-display text-lg font-semibold text-foreground">
              {heading}
              {!isEmpty && <RideCountPill count={groupRides.length} />}
            </h3>
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">{calendarContent.noRidesOnDay}</p>
            ) : (
              <motion.div
                className="flex flex-col gap-4"
                variants={shouldReduce ? undefined : staggerContainer()}
                initial="hidden"
                animate="visible"
              >
                {groupRides.map((ride) => (
                  <motion.div key={ride.id} variants={shouldReduce ? undefined : listItem}>
                    <RideCard ride={ride} variant="rides" timezone={timezone} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </section>
  );
}
