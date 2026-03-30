'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bicycle, ClockCountdown, FunnelSimple } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScheduleCard } from '@/components/rides/schedule-card';
import { cancelSignUp } from '@/lib/rides/actions';
import { cn } from '@/lib/utils';
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
  const hasStatusFilter = statusFilter !== 'upcoming';

  async function handleAction(action: string, rideId: string) {
    if (action === 'cancel-signup' || action === 'leave-waitlist') {
      await cancelSignUp(rideId);
      router.refresh();
    }
  }

  return (
    <div className="mt-8">
      <ContentToolbar
        left={
          <SectionHeading as="span">
            {statusFilter === 'upcoming'
              ? schedule.toolbar.upcoming(upcoming.length)
              : schedule.toolbar.past(past.length)}
          </SectionHeading>
        }
        right={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'relative rounded-full transition-transform active:scale-90',
                    hasStatusFilter
                      ? 'bg-primary text-primary-foreground hover:bg-action-primary-hover'
                      : 'text-muted-foreground hover:text-primary hover:bg-action-primary-subtle-bg',
                  )}
                  aria-label={schedule.statusFilter.label}
                >
                  <FunnelSimple className="size-5" />
                  {hasStatusFilter && (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary-foreground ring-2 ring-background" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{schedule.statusFilter.label}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(v: string) => setStatusFilter(v as StatusFilter)}
              >
                <DropdownMenuRadioItem value="upcoming">
                  {schedule.statusFilter.upcoming}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="past">
                  {schedule.statusFilter.past}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        className="mb-4"
      />

      {visibleRides.length > 0 ? (
        <div className="flex flex-col gap-4">
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
