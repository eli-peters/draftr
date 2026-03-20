import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  MapPin,
  Path,
  Users,
  Mountains,
  CloudRain,
  ArrowsClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { appContent } from '@/content/app';
import { getRelativeDay } from '@/lib/utils';
import { RideStatus } from '@/config/statuses';
import { dateFormats, separators, units } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

interface RideCardProps {
  ride: RideWithDetails;
}

export function RideCard({ ride }: RideCardProps) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const spotsText =
    ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : `${ride.signup_count}`;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className="p-6 mb-4">
        {/* Date + time + status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary uppercase tracking-wide">
            {relativeDay}
            {separators.dot}
            {format(rideDate, dateFormats.monthDay)}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {ride.start_time.slice(0, 5)}
          </span>
          {ride.template_id && <ArrowsClockwise className="h-3.5 w-3.5 text-muted-foreground/50" />}
          {ride.status === RideStatus.WEATHER_WATCH && (
            <Badge variant="warning" className="gap-1">
              <CloudRain className="h-3.5 w-3.5" />
              {ridesContent.status.weatherWatch}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold text-foreground leading-tight">{ride.title}</h3>

        {/* Pace Group */}
        {ride.pace_group && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ride.pace_group.name}
            {ride.is_drop_ride && (
              <span className="ml-1 text-destructive/70">· {ridesContent.card.drop}</span>
            )}
          </p>
        )}

        {/* Details Row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
          <MetadataItem icon={Users}>{spotsText}</MetadataItem>
        </div>

        {/* Tags */}
        {ride.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ride.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-sm px-2.5"
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

        {/* Capacity line */}
        <CapacityBar signupCount={ride.signup_count} capacity={ride.capacity} className="mt-5" />
      </Card>
    </Link>
  );
}
