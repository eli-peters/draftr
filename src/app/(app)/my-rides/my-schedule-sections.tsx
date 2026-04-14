'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bicycle, ClockCountdown } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ScheduleCard } from '@/components/rides/schedule-card';
import { DURATIONS, EASE, staggerContainer, listItem } from '@/lib/motion';
import { cancelSignUp } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRideSignup } from '@/lib/rides/queries';

const { schedule } = appContent;

type StatusFilter = 'upcoming' | 'past';

interface MyScheduleSectionsProps {
  upcoming: UserRideSignup[];
  past: UserRideSignup[];
  timezone: string;
}

export function MyScheduleSections({ upcoming, past, timezone }: MyScheduleSectionsProps) {
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');

  const visibleRides = statusFilter === 'upcoming' ? upcoming : past;

  async function handleAction(action: string, rideId: string) {
    if (action === 'cancel-signup' || action === 'leave-waitlist') {
      await cancelSignUp(rideId);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mt-2 mb-6 flex justify-center md:mt-0 md:mb-8">
        <SegmentedControl<StatusFilter>
          ariaLabel={schedule.statusFilter.ariaLabel}
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'upcoming', label: schedule.statusFilter.upcoming },
            { value: 'past', label: schedule.statusFilter.past },
          ]}
        />
      </div>

      {visibleRides.length > 0 ? (
        <motion.div
          className="group flex flex-col gap-6"
          variants={shouldReduce ? undefined : staggerContainer()}
          initial="hidden"
          animate="visible"
          key={statusFilter}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visibleRides.map((ride) => (
              <motion.div
                key={ride.id}
                layout
                variants={shouldReduce ? undefined : listItem}
                initial={shouldReduce ? { opacity: 0 } : undefined}
                animate={shouldReduce ? { opacity: 1 } : undefined}
                exit={
                  shouldReduce
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        x: -16,
                        transition: { duration: DURATIONS.fast, ease: EASE.out },
                      }
                }
              >
                <div className="transition-opacity duration-(--duration-normal) group-hover:opacity-40 hover:!opacity-100">
                  <ScheduleCard ride={ride} onAction={handleAction} timezone={timezone} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          title={
            statusFilter === 'upcoming'
              ? schedule.emptyState.upcoming.title
              : schedule.emptyState.past.title
          }
          description={
            statusFilter === 'upcoming'
              ? schedule.emptyState.upcoming.description
              : schedule.emptyState.past.description
          }
          icon={statusFilter === 'upcoming' ? Bicycle : ClockCountdown}
          className="mt-8"
        >
          {statusFilter === 'upcoming' && (
            <Link href={routes.rides} className="mt-4">
              <Button size="sm">{schedule.emptyState.upcoming.cta}</Button>
            </Link>
          )}
        </EmptyState>
      )}
    </div>
  );
}
