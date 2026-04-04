import { format } from 'date-fns';
import { CalendarBlank, Clock, Gauge, Mountains, Path } from '@phosphor-icons/react/dist/ssr';
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
import { appContent } from '@/content/app';
import { dateFormats, formatTime, separators, units, parseLocalDate } from '@/config/formatting';
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
  const rideDate = parseLocalDate(ride.ride_date);

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

        {/* Metadata rows */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base text-foreground">
            <CalendarBlank className="size-4 shrink-0 text-muted-foreground" />
            <span>{format(rideDate, dateFormats.full)}</span>
          </div>
          <div className="flex items-center gap-2 text-base text-foreground">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="tabular-nums">
              {formatTime(ride.start_time)}
              {ride.end_time && (
                <>
                  {separators.dash}
                  {formatTime(ride.end_time)}
                </>
              )}
            </span>
          </div>
          {ride.distance_km != null && (
            <div className="flex items-center gap-2 text-base text-foreground">
              <Path className="size-4 shrink-0 text-muted-foreground" />
              <span className="tabular-nums">
                {ride.distance_km}
                {units.km}
              </span>
            </div>
          )}
          {ride.elevation_m != null && (
            <div className="flex items-center gap-2 text-base text-foreground">
              <Mountains className="size-4 shrink-0 text-muted-foreground" />
              <span className="tabular-nums">
                {ride.elevation_m}
                {units.m}
              </span>
            </div>
          )}
          {ride.pace_group && (
            <div className="flex items-center gap-2 text-base text-foreground">
              <Gauge className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 wrap-break-word">{ride.pace_group.name}</span>
              <Badge
                variant={ride.is_drop_ride ? 'destructive' : 'secondary'}
                size="sm"
                shape="pill"
              >
                {ride.is_drop_ride ? detail.dropRide : detail.noDrop}
              </Badge>
            </div>
          )}
        </div>

        {/* Description — full text, reads as prose after the metadata */}
        {ride.description && (
          <p className="whitespace-pre-line text-body-lg leading-relaxed text-muted-foreground">
            {ride.description}
          </p>
        )}

        {/* Route map — full map when polyline exists, link-only placeholder otherwise */}
        {ride.route_polyline ? (
          <RouteMapLoader
            polylineStr={ride.route_polyline}
            routeUrl={ride.route_url}
            routeName={ride.route_name}
            aspectRatio="2.39/1"
          />
        ) : ride.route_url ? (
          <RouteMapPlaceholder routeUrl={ride.route_url} />
        ) : null}
      </div>
    </Card>
  );
}
