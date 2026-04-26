'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { CalendarBlank, Clock, Gauge, Mountains, Path } from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  StateCardBanner,
  getCardStateStyle,
  resolveCardState,
} from '@/components/rides/ride-card-parts';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { RouteMapPlaceholder } from '@/components/rides/route-map-placeholder';
import { StartLocationDisplay } from '@/components/rides/start-location-display';
import { RideWeatherSummary } from '@/components/weather/ride-weather-summary';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { appContent } from '@/content/app';
import {
  dateFormats,
  formatTime,
  formatDistance,
  formatElevation,
  separators,
  parseLocalDate,
} from '@/config/formatting';
import { capitalizeFirst } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { RideLifecycle } from '@/lib/rides/lifecycle';
import type { RideWithDetails, RideWeatherSnapshot } from '@/types/database';

const { detail } = appContent.rides;

interface RideDetailCardProps {
  ride: RideWithDetails;
  isSignedUp: boolean;
  signupStatus: string | null;
  waitlistPosition: number | null;
  lifecycle: RideLifecycle;
  weather: RideWeatherSnapshot | null;
}

/**
 * Consolidated ride detail card — groups location, metadata, route map,
 * stats, notes, tags, and creator into a single card.
 */
export function RideDetailCard({
  ride,
  isSignedUp,
  signupStatus,
  waitlistPosition,
  lifecycle,
  weather,
}: RideDetailCardProps) {
  // Resolve unified card state
  const cardState = resolveCardState({
    rideStatus: ride.status,
    signupStatus: isSignedUp ? signupStatus : undefined,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);

  // Banner label override for context-specific copy
  let bannerLabel: string | undefined;
  if (cardState === 'confirmed') bannerLabel = detail.signedUp;
  else if (cardState === 'waitlisted') {
    bannerLabel = waitlistPosition
      ? appContent.schedule.status.waitlisted(waitlistPosition)
      : appContent.rides.roster.waitlisted;
  }

  return (
    <Card className={cn('mt-6 overflow-clip p-0', stateStyle.borderClass)}>
      {/* Unified banner */}
      <StateCardBanner style={stateStyle} labelOverride={bannerLabel} />

      {/* Card body */}
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
        <RideDetailCardBody ride={ride} weather={weather} includeRouteMap />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Reusable body — same inner content without the outer Card / banner chrome.
// Used by the mobile map-backdrop layout, which renders the route map as the
// page backdrop and omits the inline route preview.
// ---------------------------------------------------------------------------

interface RideDetailCardBodyProps {
  ride: RideWithDetails;
  weather: RideWeatherSnapshot | null;
  /**
   * When true, render the inline route map / placeholder at the bottom.
   * Set to false when the route map is rendered elsewhere (e.g. as a backdrop).
   */
  includeRouteMap?: boolean;
  className?: string;
}

export function RideDetailCardBody({
  ride,
  weather,
  includeRouteMap = true,
  className,
}: RideDetailCardBodyProps) {
  const prefs = useUserPrefs();
  const rideDate = parseLocalDate(ride.ride_date);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Start location */}
      {ride.start_location_name && (
        <StartLocationDisplay
          name={ride.start_location_name}
          address={ride.start_location_address ?? ''}
          latitude={ride.start_latitude}
          longitude={ride.start_longitude}
        />
      )}

      {/* Weather — forecast for ride date/time */}
      <RideWeatherSummary weather={weather} />

      <div className="border-t border-border" />

      {/* Metadata rows — bold value with expressive icon; no label required */}
      <div className="space-y-3">
        <StatRow icon={CalendarBlank} value={format(rideDate, dateFormats.full)} />
        <StatRow
          icon={Clock}
          value={
            <>
              {formatTime(ride.start_time, prefs.time_format)}
              {ride.end_time && (
                <>
                  {separators.dash}
                  {formatTime(ride.end_time, prefs.time_format)}
                </>
              )}
            </>
          }
        />
        {ride.distance_km != null && (
          <StatRow icon={Path} value={formatDistance(ride.distance_km, prefs.distance_unit)} />
        )}
        {ride.elevation_m != null && (
          <StatRow
            icon={Mountains}
            value={formatElevation(ride.elevation_m, prefs.elevation_unit)}
          />
        )}
        {ride.pace_group && (
          <StatRow
            icon={Gauge}
            value={ride.pace_group.name}
            trailing={
              <Badge
                variant={ride.is_drop_ride ? 'destructive' : 'status-confirmed'}
                shape="pill"
                size="sm"
              >
                {ride.is_drop_ride ? detail.dropRide : detail.noDrop}
              </Badge>
            }
          />
        )}
      </div>

      {ride.description && (
        <p className="select-text whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {capitalizeFirst(ride.description)}
        </p>
      )}

      {includeRouteMap &&
        (ride.route_polyline ? (
          <RouteMapLoader
            polylineStr={ride.route_polyline}
            routeUrl={ride.route_url}
            routeName={ride.route_name}
            aspectRatio="2.39/1"
          />
        ) : ride.route_url ? (
          <RouteMapPlaceholder routeUrl={ride.route_url} />
        ) : null)}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface StatRowProps {
  icon: PhosphorIcon;
  value: ReactNode;
  trailing?: ReactNode;
}

function StatRow({ icon: Icon, value, trailing }: StatRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" weight="duotone" />
      <span className="min-w-0 text-base font-semibold tabular-nums text-foreground">{value}</span>
      {trailing}
    </div>
  );
}
