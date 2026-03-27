import { format } from 'date-fns';
import {
  MapPin,
  CalendarBlank,
  Clock,
  Path,
  CheckCircle,
  Timer,
  Play,
  HourglassSimpleMedium,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CardBanner, RideBanner } from '@/components/rides/ride-card-parts';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { appContent } from '@/content/app';
import { dateFormats, formatTime, separators, units, parseLocalDate } from '@/config/formatting';
import { RideStatus, SignupStatus } from '@/config/statuses';
import type { RideLifecycle } from '@/lib/rides/lifecycle';
import type { RideWithDetails } from '@/types/database';

const { detail, status: rideStatus } = appContent.rides;

interface RideDetailCardProps {
  ride: RideWithDetails;
  isSignedUp: boolean;
  signupStatus: string | null;
  waitlistPosition: number | null;
  confirmedCount: number;
  lifecycle: RideLifecycle;
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
  confirmedCount,
  lifecycle,
}: RideDetailCardProps) {
  const rideDate = parseLocalDate(ride.ride_date);
  const isCancelled = ride.status === RideStatus.CANCELLED;
  const isWeatherWatch = ride.status === RideStatus.WEATHER_WATCH;
  const isWaitlisted = signupStatus === SignupStatus.WAITLISTED;

  // Stats items — only render columns with data
  const statsItems: { label: string; value: string }[] = [];
  if (ride.distance_km != null) {
    statsItems.push({ label: detail.distanceLabel, value: `${ride.distance_km}${units.km}` });
  }
  if (ride.elevation_m != null) {
    statsItems.push({ label: detail.elevationLabel, value: `${ride.elevation_m}${units.m}` });
  }
  // Spots remaining / signed up
  if (ride.capacity != null) {
    statsItems.push({
      label: detail.spotsRemainingLabel,
      value: `${confirmedCount}/${ride.capacity}`,
    });
  } else {
    statsItems.push({
      label: detail.spotsRemainingLabel,
      value: detail.signedUpCount(confirmedCount),
    });
  }

  return (
    <Card className="mt-6 overflow-clip p-0">
      {/* Status banners — priority: cancelled > weather watch > signed up */}
      {isCancelled && <RideBanner type={RideStatus.CANCELLED} />}
      {isWeatherWatch && !isCancelled && <RideBanner type={RideStatus.WEATHER_WATCH} />}
      {isSignedUp && !isCancelled && isWaitlisted && lifecycle !== 'upcoming' && (
        <CardBanner
          icon={Timer}
          label={detail.waitlistClosed}
          bgClass="bg-banner-muted-bg"
          textClass="text-banner-muted-text"
        />
      )}
      {isSignedUp && !isCancelled && isWaitlisted && lifecycle === 'upcoming' && (
        <CardBanner
          icon={HourglassSimpleMedium}
          label={
            waitlistPosition
              ? appContent.schedule.status.waitlisted(waitlistPosition)
              : appContent.rides.roster.waitlisted
          }
          bgClass="bg-banner-warning-bg"
          textClass="text-banner-warning-text"
        />
      )}
      {isSignedUp && !isCancelled && !isWaitlisted && (
        <CardBanner
          icon={CheckCircle}
          label={detail.signedUp}
          bgClass="bg-banner-success-bg"
          textClass="text-banner-success-text"
        />
      )}
      {lifecycle === 'about_to_start' && !isCancelled && (
        <CardBanner
          icon={Timer}
          label={rideStatus.aboutToStart}
          bgClass="bg-banner-info-bg"
          textClass="text-banner-info-text"
        />
      )}
      {lifecycle === 'in_progress' && !isCancelled && (
        <CardBanner
          icon={Play}
          label={rideStatus.inProgress}
          bgClass="bg-banner-info-bg"
          textClass="text-banner-info-text"
        />
      )}

      {/* Card body */}
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
        {/* Meeting location */}
        {ride.meeting_location && (
          <div className="flex items-start gap-2">
            <MapPin weight="duotone" className="mt-0.5 size-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
                {ride.meeting_location.name}
              </p>
              {ride.meeting_location.address && (
                <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                  {ride.meeting_location.address}
                </p>
              )}
            </div>
          </div>
        )}

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
          <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted-foreground">
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
                  <span className="font-mono text-base font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Route map — only shown when route data exists */}
        {ride.route_polyline && (
          <RouteMapLoader
            polylineStr={ride.route_polyline}
            routeUrl={ride.route_url}
            routeName={ride.route_name}
          />
        )}
      </div>
    </Card>
  );
}
