'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CardContentSection,
  CardFooterSection,
  StateCardBanner,
  getCardStateStyle,
  resolveCardState,
} from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus, SignupStatus } from '@/config/statuses';
import { dateFormats, formatTime, formatDuration, parseLocalDate } from '@/config/formatting';
import { getRideAvailability, getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { buildDirectionsUrl } from '@/lib/maps/directions';
import type { UserRideSignup } from '@/lib/rides/queries';

const { schedule } = appContent;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleAction = 'cancel-signup' | 'leave-waitlist';

interface ScheduleCardProps {
  ride: UserRideSignup;
  onAction?: (action: ScheduleAction, rideId: string) => void;
}

// ---------------------------------------------------------------------------
// ScheduleCard
// ---------------------------------------------------------------------------

export function ScheduleCard({ ride, onAction }: ScheduleCardProps) {
  const rideDate = parseLocalDate(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const isCompleted = ride.signup_status === SignupStatus.COMPLETED;
  const isCancelled = ride.signup_status === SignupStatus.CANCELLED;
  const isWaitlisted = ride.signup_status === SignupStatus.WAITLISTED;

  // Availability check — hides cancel/leave buttons past cutoff
  const availability = getRideAvailability(
    {
      ride_date: ride.ride_date,
      start_time: ride.start_time,
      end_time: ride.end_time,
      status: isCancelled ? RideStatus.CANCELLED : 'scheduled',
      capacity: ride.capacity,
    },
    ride.signup_count,
  );

  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time);

  // Resolve unified card state
  const cardState = resolveCardState({
    rideStatus: isCancelled ? RideStatus.CANCELLED : undefined,
    signupStatus: ride.signup_status,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);

  // Banner label — use schedule-specific copy for status labels
  let bannerLabel: string | undefined;
  if (cardState === 'confirmed') bannerLabel = schedule.status.confirmed;
  else if (cardState === 'waitlisted')
    bannerLabel = schedule.status.waitlisted(ride.waitlist_position ?? 0);
  else if (cardState === 'completed') bannerLabel = schedule.status.completed;
  else if (cardState === 'cancelled') bannerLabel = schedule.status.cancelled;

  const durationDisplay = formatDuration(ride.start_time, ride.end_time);

  const directionsUrl = buildDirectionsUrl({
    latitude: ride.meeting_location_latitude,
    longitude: ride.meeting_location_longitude,
    address: ride.meeting_location_address,
    name: ride.meeting_location_name,
  });

  const statusKey = isCancelled
    ? 'cancelled'
    : isCompleted
      ? 'completed'
      : isWaitlisted
        ? 'waitlisted'
        : 'confirmed';

  const hasFooter = statusKey !== 'completed' && statusKey !== 'cancelled';

  return (
    <Card
      className={cn(
        'overflow-clip p-0',
        stateStyle.borderClass,
        isCompleted && 'opacity-completed',
      )}
    >
      {/* Banner — always present, unified style */}
      <StateCardBanner style={stateStyle} labelOverride={bannerLabel} />

      {/* Content — tappable, links to ride detail */}
      <Link href={routes.ride(ride.id)} className="block">
        <CardContentSection
          className="px-5 pt-4 pb-5"
          date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
          time={formatTime(ride.start_time)}
          title={ride.title}
          paceGroupName={ride.pace_group_name}
          paceGroupSortOrder={ride.pace_group_sort_order}
          distanceKm={ride.distance_km}
          elevationM={ride.elevation_m}
          durationDisplay={durationDisplay}
          locationName={ride.meeting_location_name}
          weather={ride.weather}
        />
      </Link>

      {/* Footer — context-dependent actions */}
      {hasFooter && (
        <CardFooterSection>
          <div className="flex items-center justify-between gap-3">
            {statusKey === 'confirmed' && (
              <>
                {availability.canCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => onAction?.('cancel-signup', ride.id)}
                  >
                    {schedule.actions.cancelSignup}
                  </Button>
                )}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'ml-auto')}
                  >
                    {schedule.actions.getDirections}
                  </a>
                )}
              </>
            )}
            {statusKey === 'waitlisted' && (
              <>
                {availability.canCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-warning hover:text-warning"
                    onClick={() => onAction?.('leave-waitlist', ride.id)}
                  >
                    {schedule.actions.leaveWaitlist}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooterSection>
      )}
    </Card>
  );
}
