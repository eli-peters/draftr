'use client';

import { Bicycle, ArrowUp } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/motion';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { RideCard } from '@/components/rides/ride-card';
import { appContent } from '@/content/app';
import type { RideWithDetails } from '@/types/database';

const { calendar: calendarContent, rides: ridesContent } = appContent;

interface AgendaZoneProps {
  rides: RideWithDetails[];
  selectedDate: Date | null;
  timezone: string;
  onClearSelection: () => void;
}

export function AgendaZone({ rides, selectedDate, timezone, onClearSelection }: AgendaZoneProps) {
  const shouldReduce = useReducedMotion();

  return (
    <section className="mt-2">
      {/* "Show all upcoming" button when a day is selected */}
      {selectedDate !== null && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={onClearSelection}
          >
            <ArrowUp className="mr-1.5 h-3.5 w-3.5" />
            {calendarContent.showAllUpcoming}
          </Button>
        </div>
      )}

      {rides.length > 0 ? (
        <motion.div
          className="flex flex-col gap-4"
          variants={shouldReduce ? undefined : staggerContainer()}
          initial="hidden"
          animate="visible"
          key={selectedDate?.toISOString() ?? 'all'}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {rides.map((ride) => (
              <motion.div
                key={ride.id}
                layout
                variants={shouldReduce ? undefined : listItem}
                initial={shouldReduce ? { opacity: 0 } : undefined}
                animate={shouldReduce ? { opacity: 1 } : undefined}
                exit={shouldReduce ? { opacity: 0 } : undefined}
              >
                <RideCard ride={ride} variant="rides" timezone={timezone} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          title={selectedDate ? calendarContent.noRidesOnDay : ridesContent.feed.emptyState.title}
          description={selectedDate ? '' : ridesContent.feed.emptyState.description}
          icon={Bicycle}
          className="mt-8"
        />
      )}
    </section>
  );
}
