'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bicycle, ClockCountdown } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { ScheduleCard } from '@/components/rides/schedule-card';
import { cancelSignUp } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRideSignup } from '@/lib/rides/queries';

const { schedule } = appContent;

interface MyScheduleSectionsProps {
  upcoming: UserRideSignup[];
  past: UserRideSignup[];
}

export function MyScheduleSections({ upcoming, past }: MyScheduleSectionsProps) {
  const router = useRouter();

  async function handleAction(action: string, rideId: string) {
    if (action === 'cancel-signup' || action === 'leave-waitlist') {
      await cancelSignUp(rideId);
      router.refresh();
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      {/* Upcoming section */}
      <section>
        <SectionHeading className="mb-4">{schedule.sections.upcoming}</SectionHeading>
        {upcoming.length === 0 ? (
          <EmptyState
            title={schedule.emptyState.upcoming.title}
            description={schedule.emptyState.upcoming.description}
            icon={Bicycle}
            className="mt-8"
          >
            <Link href={routes.rides} className="mt-4">
              <Button size="sm">{schedule.emptyState.upcoming.cta}</Button>
            </Link>
          </EmptyState>
        ) : (
          <div>
            {upcoming.map((ride) => (
              <ScheduleCard key={ride.id} ride={ride} onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      {/* Past section */}
      <section>
        <SectionHeading className="mb-4">{schedule.sections.past}</SectionHeading>
        {past.length === 0 ? (
          <EmptyState
            title={schedule.emptyState.past.title}
            description={schedule.emptyState.past.description}
            icon={ClockCountdown}
            className="mt-8"
          />
        ) : (
          <div>
            {past.map((ride) => (
              <ScheduleCard key={ride.id} ride={ride} onAction={handleAction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
