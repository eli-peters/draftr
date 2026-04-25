'use client';

import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/motion';
import { EmptyState } from '@/components/ui/empty-state';
import { ScheduleCard } from '@/components/rides/schedule-card';
import { appContent } from '@/content/app';
import type { UserRideSignup } from '@/lib/rides/queries';

const { profile: profileContent } = appContent;

interface RideHistoryListProps {
  rides: UserRideSignup[];
  timezone: string;
}

export function RideHistoryList({ rides, timezone }: RideHistoryListProps) {
  const shouldReduce = useReducedMotion();

  if (rides.length === 0) {
    return (
      <EmptyState
        title={profileContent.history.emptyState.title}
        description={profileContent.history.emptyState.description}
        icon={<Bicycle weight="duotone" />}
        className="mt-12"
      />
    );
  }

  return (
    <motion.div
      className="mt-4 flex flex-col gap-4"
      variants={shouldReduce ? undefined : staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence initial={false}>
        {rides.map((ride) => (
          <motion.div key={ride.id} variants={shouldReduce ? undefined : listItem}>
            <ScheduleCard ride={ride} timezone={timezone} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
