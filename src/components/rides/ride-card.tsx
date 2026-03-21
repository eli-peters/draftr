import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  RideBanner,
  MetadataStatsLarge,
  MetadataStatsMedium,
  VibeTags,
  CapacityBarLarge,
  RiderCount,
  LocationRow,
} from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { getRelativeDay } from '@/lib/utils';
import { RideStatus } from '@/config/statuses';
import { dateFormats, separators, units, getPaceBadgeVariant } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  size?: 'large' | 'medium';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOT_SEPARATOR = '·';

function getSpeedRange(pace: RideWithDetails['pace_group']): string | null {
  if (!pace?.moving_pace_min || !pace?.moving_pace_max) return null;
  return `${pace.moving_pace_min}-${pace.moving_pace_max}${units.kmh}`;
}

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

export function RideCard({ ride, size = 'large' }: RideCardProps) {
  const rideDate = parseISO(ride.ride_date);
  const hasAlert = ride.status === RideStatus.WEATHER_WATCH || ride.status === RideStatus.CANCELLED;
  const paceVariant = ride.pace_group ? getPaceBadgeVariant(ride.pace_group.name) : null;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card
        className={
          hasAlert
            ? 'flex flex-col items-center overflow-clip rounded-2xl border border-border-subtle bg-surface-default'
            : 'overflow-clip rounded-2xl border border-border-subtle bg-surface-default p-6'
        }
      >
        {/* Banner (alert cards only) */}
        {hasAlert && <RideBanner type={ride.status as 'weather_watch' | 'cancelled'} />}

        {/* Content container */}
        <div className={hasAlert ? 'w-full px-6 pt-4 pb-6' : ''}>
          {size === 'large' ? (
            <LargeLayout ride={ride} rideDate={rideDate} paceVariant={paceVariant} />
          ) : (
            <MediumLayout ride={ride} rideDate={rideDate} paceVariant={paceVariant} />
          )}
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Large Layout
// ---------------------------------------------------------------------------

interface LayoutProps {
  ride: RideWithDetails;
  rideDate: Date;
  paceVariant: string | null;
}

function LargeLayout({ ride, rideDate, paceVariant }: LayoutProps) {
  const speedRange = getSpeedRange(ride.pace_group);

  return (
    <div className="flex flex-col gap-4">
      {/* Top container */}
      <div className="flex flex-col gap-4">
        {/* Top group */}
        <div className="flex flex-col gap-2">
          {/* Date & name */}
          <div className="flex flex-col gap-0.5">
            {/* Date & time row */}
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[11px] font-semibold uppercase leading-[15px] tracking-[0.66px] text-action-primary">
                {format(rideDate, dateFormats.full)}
              </span>
              <span className="font-sans text-[13px] font-bold leading-5 text-accent-neutral-muted">
                {DOT_SEPARATOR}
              </span>
              <span className="font-mono text-xs font-normal leading-[17px] text-text-tertiary">
                {ride.start_time.slice(0, 5)}
              </span>
            </div>
            {/* Ride name */}
            <h3 className="font-display text-xl font-semibold leading-[26px] tracking-[-0.06px] text-text-primary">
              {ride.title}
            </h3>
          </div>

          {/* Pace & speed */}
          {paceVariant && ride.pace_group && (
            <div className="flex items-center gap-1.5">
              <Badge
                variant={paceVariant as never}
                shape="rounded"
                size="sm"
                className="px-3 py-1 text-[11px] font-semibold leading-[15px]"
              >
                {ride.pace_group.name}
              </Badge>
              {speedRange && (
                <span className="font-mono text-[10px] font-normal leading-[14px] text-text-tertiary">
                  {speedRange}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Metadata stats (stacked) */}
        <MetadataStatsLarge
          distanceKm={ride.distance_km}
          elevationM={ride.elevation_m}
          estimatedMinutes={null}
        />
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border-subtle" />

      {/* Bottom container */}
      <div className="flex flex-col gap-4">
        {/* Location + tags */}
        <div className="flex flex-col gap-3">
          {ride.meeting_location && <LocationRow name={ride.meeting_location.name} />}
          <VibeTags tags={ride.tags} />
        </div>

        {/* Capacity bar */}
        <CapacityBarLarge signupCount={ride.signup_count} capacity={ride.capacity} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Medium Layout
// ---------------------------------------------------------------------------

function MediumLayout({ ride, rideDate, paceVariant }: LayoutProps) {
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);

  return (
    <div className="flex flex-col gap-3">
      {/* Top container */}
      <div className="flex flex-col gap-2">
        {/* Date & name (reversed order from Large) */}
        <div className="flex flex-col gap-0.5">
          {/* Ride name (FIRST in Medium) */}
          <h3 className="truncate font-display text-lg font-semibold leading-6 tracking-[-0.03px] text-text-primary">
            {ride.title}
          </h3>
          {/* Day & time row */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold leading-[17px] text-text-tertiary uppercase">
              {relativeDay}
            </span>
            <span className="font-sans text-[13px] font-bold leading-5 text-accent-neutral-muted">
              {DOT_SEPARATOR}
            </span>
            <span className="font-mono text-xs font-bold leading-[17px] text-text-tertiary">
              {ride.start_time.slice(0, 5)}
            </span>
          </div>
        </div>

        {/* Metadata (inline with icons) */}
        <MetadataStatsMedium
          distanceKm={ride.distance_km}
          elevationM={ride.elevation_m}
          estimatedMinutes={null}
        />
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border-subtle" />

      {/* Bottom container (horizontal) */}
      <div className="flex items-center gap-4">
        {paceVariant && ride.pace_group && (
          <Badge
            variant={paceVariant as never}
            shape="rounded"
            size="sm"
            className="px-3 py-1 text-[11px] font-semibold leading-[15px]"
          >
            {ride.pace_group.name}
          </Badge>
        )}
        <RiderCount signupCount={ride.signup_count} capacity={ride.capacity} />
      </div>
    </div>
  );
}
