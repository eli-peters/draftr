'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SPRINGS } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import {
  CardContentSection,
  StateCardShell,
  getCardStateStyle,
  resolveCardState,
} from '@/components/rides/ride-card-parts';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { appContent } from '@/content/app';
import { getRelativeDay } from '@/lib/utils';
import {
  dateFormats,
  formatDistance,
  formatTime,
  getPaceBadgeVariant,
  parseLocalDate,
} from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const MotionLink = motion.create(Link);

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  variant?: 'home' | 'rides';
  timezone: string;
}

export function RideCard({ ride, variant = 'rides', timezone }: RideCardProps) {
  const prefs = useUserPrefs();
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time, timezone);
  const cardState = resolveCardState({
    rideStatus: ride.status,
    signupStatus: ride.current_user_signup_status,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);

  const isHome = variant === 'home';
  const shouldReduce = useReducedMotion();

  const waitlistLabelOverride =
    cardState === 'waitlisted' && ride.current_user_waitlist_position
      ? appContent.schedule.status.waitlisted(ride.current_user_waitlist_position)
      : undefined;

  return (
    <MotionLink
      href={routes.ride(ride.id)}
      whileHover={shouldReduce ? undefined : { scale: 1.04 }}
      whileTap={shouldReduce ? undefined : { scale: 0.96 }}
      transition={SPRINGS.gentle}
      className="group block cursor-pointer"
    >
      <StateCardShell stateStyle={stateStyle} stripeLabelOverride={waitlistLabelOverride}>
        {isHome ? (
          <HomeLayout ride={ride} timeFormat={prefs.time_format} />
        ) : (
          <RidesLayout
            ride={ride}
            timeFormat={prefs.time_format}
            distanceUnit={prefs.distance_unit}
          />
        )}
      </StateCardShell>
    </MotionLink>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / glanceable
// ---------------------------------------------------------------------------

function HomeLayout({ ride, timeFormat }: { ride: RideWithDetails; timeFormat: '12h' | '24h' }) {
  const rideDate = parseLocalDate(ride.ride_date);

  return (
    <CardContentSection
      className="px-5 py-5"
      date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
      time={formatTime(ride.start_time, timeFormat)}
      title={ride.title}
      paceGroupName={ride.pace_group?.name ?? null}
      paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
      locationName={ride.start_location_name ?? null}
      weather={ride.weather}
    />
  );
}

// §6 Option A — list card stays stripped: name + time (row 1), pace + distance (row 2).
// No avatars/weather/location here; density is the point.
// ---------------------------------------------------------------------------
// Rides Layout — compact two-row panel (title/time · pace/distance)
// ---------------------------------------------------------------------------

function RidesLayout({
  ride,
  timeFormat,
  distanceUnit,
}: {
  ride: RideWithDetails;
  timeFormat: '12h' | '24h';
  distanceUnit: 'km' | 'mi';
}) {
  const time = formatTime(ride.start_time, timeFormat);
  const paceName = ride.pace_group?.name ?? null;
  const paceSortOrder = ride.pace_group?.sort_order ?? null;

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold text-foreground">
          {ride.title}
        </h3>
        <span className="shrink-0 font-sans text-base font-bold text-foreground">{time}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        {paceName ? (
          <Badge variant={paceSortOrder ? getPaceBadgeVariant(paceSortOrder) : 'secondary'}>
            {paceName}
          </Badge>
        ) : (
          <span />
        )}
        {ride.distance_km != null && (
          <span className="shrink-0 font-sans text-sm text-muted-foreground">
            {formatDistance(ride.distance_km, distanceUnit)}
          </span>
        )}
      </div>
    </div>
  );
}
