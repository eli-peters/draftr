import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowRight, MapPin, Path, Users } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { appContent } from '@/content/app';
import { getRelativeDay } from '@/lib/utils';
import { dateFormats, separators, units } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { dashboard, rides: ridesContent } = appContent;

export function HeroRideCard({ ride }: { ride: RideWithDetails }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate);
  const spotsLeft = ride.capacity != null ? ride.capacity - ride.signup_count : null;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className="relative p-6 overflow-hidden">
        {/* Day + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">{relativeDay}</span>
            <span className="text-base text-muted-foreground">
              {format(rideDate, dateFormats.monthDay)}
              {separators.dot}
              {ride.start_time.slice(0, 5)}
            </span>
          </div>
          {spotsLeft != null && spotsLeft > 0 && (
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {dashboard.spotsLeft(spotsLeft)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-xl font-bold text-foreground leading-tight">{ride.title}</h3>

        {/* Pace */}
        {ride.pace_group && (
          <p className="mt-1.5 text-base text-muted-foreground">
            {ride.pace_group.name}
            {ride.is_drop_ride && (
              <span className="ml-1 text-destructive/70">· {ridesContent.card.drop}</span>
            )}
          </p>
        )}

        {/* Details */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-muted-foreground">
          {ride.meeting_location && (
            <MetadataItem icon={MapPin}>{ride.meeting_location.name}</MetadataItem>
          )}
          {ride.distance_km != null && (
            <MetadataItem icon={Path} className="text-info">
              {ride.distance_km}
              {units.km}
            </MetadataItem>
          )}
          <MetadataItem icon={Users}>
            {ride.signup_count}
            {ride.capacity != null ? `/${ride.capacity}` : ''} {ridesContent.card.riders}
          </MetadataItem>
        </div>

        {/* Capacity line */}
        <CapacityBar signupCount={ride.signup_count} capacity={ride.capacity} className="mt-5" />

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-primary">
          {dashboard.viewRide}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
