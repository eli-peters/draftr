'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CardContentSection,
  CardFooterSection,
  StateCardBanner,
  getCardStateStyle,
  resolveCardState,
  type CardState,
} from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus, SignupStatus } from '@/config/statuses';
import { dateFormats, formatTime, parseLocalDate } from '@/config/formatting';
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
  timezone: string;
}

// ---------------------------------------------------------------------------
// ScheduleCard
// ---------------------------------------------------------------------------

export function ScheduleCard({ ride, onAction, timezone }: ScheduleCardProps) {
  const rideDate = parseLocalDate(ride.ride_date);
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
    timezone,
  );

  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time, timezone);

  // Resolve unified card state
  const cardState = resolveCardState({
    rideStatus: isCancelled ? RideStatus.CANCELLED : undefined,
    signupStatus: ride.signup_status,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);
  const scheduleSuppressed: CardState[] = ['confirmed'];

  // Banner label — use schedule-specific copy for status labels
  // 'confirmed' is suppressed (card presence implies confirmation)
  let bannerLabel: string | undefined;
  if (cardState === 'waitlisted')
    bannerLabel = schedule.status.waitlisted(ride.waitlist_position ?? 0);
  else if (cardState === 'completed') bannerLabel = schedule.status.completed;
  else if (cardState === 'cancelled') bannerLabel = schedule.status.cancelled;

  const directionsUrl = buildDirectionsUrl({
    latitude: ride.start_location_latitude,
    longitude: ride.start_location_longitude,
    address: ride.start_location_address,
    name: ride.start_location_name,
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
        cardState === 'confirmed' ? 'border-border-default' : stateStyle.borderClass,
        isCompleted && 'opacity-completed',
      )}
    >
      {/* Banner — suppressed for confirmed (card presence implies it) */}
      <StateCardBanner
        style={stateStyle}
        state={cardState}
        suppressStates={scheduleSuppressed}
        labelOverride={bannerLabel}
      />

      {/* Content — tappable, links to ride detail */}
      <Link href={routes.ride(ride.id)} className="block">
        <CardContentSection
          className="px-5 pt-4 pb-5"
          date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
          time={formatTime(ride.start_time)}
          title={ride.title}
          paceGroupName={ride.pace_group_name}
          paceGroupSortOrder={ride.pace_group_sort_order}
          distanceKm={ride.distance_km}
          locationName={ride.start_location_name}
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
