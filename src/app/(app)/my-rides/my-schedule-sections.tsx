'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bicycle, ClockCountdown } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ScheduleCard } from '@/components/rides/schedule-card';
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
        <div className="flex flex-col gap-6">
          {visibleRides.map((ride) => (
            <ScheduleCard key={ride.id} ride={ride} onAction={handleAction} timezone={timezone} />
          ))}
        </div>
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
