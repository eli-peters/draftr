import { format } from 'date-fns';
import { MapPin, CalendarBlank, Clock, Path } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import {
  StateCardBanner,
  getCardStateStyle,
  resolveCardState,
} from '@/components/rides/ride-card-parts';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { RouteMapPlaceholder } from '@/components/rides/route-map-placeholder';
import { RideWeatherSummary } from '@/components/weather/ride-weather-summary';
import { buildDirectionsUrl } from '@/lib/maps/directions';
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

  // Stats items — only render columns with data
  const statsItems: { label: string; value: string }[] = [];
  if (ride.distance_km != null) {
    statsItems.push({ label: detail.distanceLabel, value: `${ride.distance_km}${units.km}` });
  }
  if (ride.elevation_m != null) {
    statsItems.push({ label: detail.elevationLabel, value: `${ride.elevation_m}${units.m}` });
  }

  return (
    <Card className={cn('mt-6 overflow-clip p-0', stateStyle.borderClass)}>
      {/* Unified banner */}
      <StateCardBanner style={stateStyle} labelOverride={bannerLabel} />

      {/* Card body */}
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
        {/* Start location */}
        {ride.start_location_name &&
          (() => {
            const directionsUrl = buildDirectionsUrl({
              latitude: ride.start_latitude,
              longitude: ride.start_longitude,
              address: ride.start_location_address,
              name: ride.start_location_name,
            });
            const Wrapper = directionsUrl ? 'a' : 'div';
            const wrapperProps = directionsUrl
              ? { href: directionsUrl, target: '_blank' as const, rel: 'noopener noreferrer' }
              : {};
            return (
              <Wrapper {...wrapperProps} className="group flex items-start gap-2">
                <MapPin weight="duotone" className="mt-0.5 size-6 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold tracking-[-0.015em] text-foreground decoration-primary/30 underline-offset-2 group-hover:underline">
                    {ride.start_location_name}
                  </p>
                  {ride.start_location_address && (
                    <p className="mt-0.5 text-body-sm text-muted-foreground">
                      {ride.start_location_address}
                    </p>
                  )}
                </div>
              </Wrapper>
            );
          })()}

        {/* Weather — forecast for ride date/time */}
        <RideWeatherSummary weather={weather} />

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
          {ride.pace_group && (
            <div className="flex items-center gap-2 text-base text-foreground">
              <Path className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 wrap-break-word">
                {ride.pace_group.name}
                {ride.pace_group.moving_pace_min && ride.pace_group.moving_pace_max
                  ? ` (${ride.pace_group.moving_pace_min}–${ride.pace_group.moving_pace_max}${units.kmh})`
                  : ''}
                {` · ${ride.is_drop_ride ? detail.dropRide : detail.noDrop}`}
              </span>
            </div>
          )}
        </div>

        {/* Description — full text, reads as prose after the metadata */}
        {ride.description && (
          <p className="whitespace-pre-line text-body-lg leading-relaxed text-muted-foreground">
            {ride.description}
          </p>
        )}

        {/* Stats box */}
        {statsItems.length > 0 && (
          <div className="rounded-xl bg-accent-secondary-subtle p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${statsItems.length}, 1fr)` }}
            >
              {statsItems.map((item) => (
                <div key={item.label} className="flex flex-col items-start">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="font-mono text-base font-medium tabular-nums text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Route map — full map when polyline exists, link-only placeholder otherwise */}
        {ride.route_polyline ? (
          <RouteMapLoader
            polylineStr={ride.route_polyline}
            routeUrl={ride.route_url}
            routeName={ride.route_name}
          />
        ) : ride.route_url ? (
          <RouteMapPlaceholder routeUrl={ride.route_url} />
        ) : null}
      </div>
    </Card>
  );
}
