import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { MapPin, Path, Users, Mountains, CloudRain, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus } from '@/config/statuses';
import { dateFormats, separators, units } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  variant?: 'home' | 'rides';
}

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

export function RideCard({ ride, variant = 'rides' }: RideCardProps) {
  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className="mb-4 p-0 overflow-clip">
        {variant === 'home' ? (
          <HomeLayout ride={ride} />
        ) : (
          <RidesLayout ride={ride} />
        )}
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / time-focused
// ---------------------------------------------------------------------------

function HomeLayout({ ride }: { ride: RideWithDetails }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);

  return (
    <div className="flex flex-col gap-1.5 p-4">
      {/* Name + pace badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold leading-tight text-foreground truncate">
          {ride.title}
        </h3>
        {ride.pace_group && (
          <Badge variant="secondary" size="sm" className="shrink-0">
            {ride.pace_group.name}
          </Badge>
        )}
      </div>

      {/* Single monospace metadata line: day · time · distance */}
      <p className="font-mono text-xs text-muted-foreground">
        {relativeDay.toUpperCase()}
        {separators.dot}
        {ride.start_time.slice(0, 5)}
        {ride.distance_km != null && (
          <>
            {separators.dot}
            {ride.distance_km}
            {units.km}
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rides Layout — rich / decision-making
// ---------------------------------------------------------------------------

function RidesLayout({ ride }: { ride: RideWithDetails }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const spotsRemaining =
    ride.capacity != null ? ride.capacity - ride.signup_count : null;
  const leaderName =
    ride.creator?.display_name ?? ride.creator?.full_name ?? null;

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Weather watch banner */}
      {ride.status === RideStatus.WEATHER_WATCH && (
        <Badge variant="warning" className="gap-1 self-start">
          <CloudRain className="h-3.5 w-3.5" />
          {ridesContent.status.weatherWatch}
        </Badge>
      )}

      {/* Top section */}
      <div className="flex flex-col gap-2">
        {/* Date + time */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            {relativeDay}
            {separators.dot}
            {format(rideDate, dateFormats.monthDay)}
          </span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {ride.start_time.slice(0, 5)}
          </span>
          {ride.template_id && (
            <ArrowsClockwise className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>

        {/* Title + pace */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
            {ride.title}
          </h3>
          {ride.pace_group && (
            <Badge variant="secondary" size="sm" className="shrink-0">
              {ride.pace_group.name}
            </Badge>
          )}
        </div>

        {/* Description (2-line clamp) */}
        {ride.description && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {ride.description}
          </p>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {ride.meeting_location && (
          <MetadataItem icon={MapPin}>{ride.meeting_location.name}</MetadataItem>
        )}
        {ride.distance_km != null && (
          <MetadataItem icon={Path} className="text-info">
            {ride.distance_km}
            {units.km}
          </MetadataItem>
        )}
        {ride.elevation_m != null && (
          <MetadataItem icon={Mountains} className="text-info">
            {ride.elevation_m}
            {units.m}
          </MetadataItem>
        )}
      </div>

      {/* Tags */}
      {ride.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ride.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="px-2.5 text-sm"
              style={
                tag.color
                  ? {
                      backgroundColor: `color-mix(in srgb, ${tag.color} 15%, transparent)`,
                      color: tag.color,
                    }
                  : undefined
              }
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px w-full bg-border" />

      {/* Footer: spots + leader | CTA */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {spotsRemaining != null && (
            <span
              className={cn(
                'flex items-center gap-1.5',
                spotsRemaining <= 3 && spotsRemaining > 0 && 'text-warning',
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {ridesContent.card.spotsRemaining(spotsRemaining)}
            </span>
          )}
          {leaderName && (
            <span className="truncate">{ridesContent.card.ledBy(leaderName)}</span>
          )}
        </div>
        <Button size="sm" className="shrink-0">
          {ridesContent.card.joinRide}
        </Button>
      </div>

      {/* Capacity bar */}
      <CapacityBar signupCount={ride.signup_count} capacity={ride.capacity} />
    </div>
  );
}
