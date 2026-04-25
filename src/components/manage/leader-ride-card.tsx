'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  CardContentSection,
  CardFooterSection,
  StateCardBanner,
  RiderCount,
  getCardStateStyle,
  resolveCardState,
} from '@/components/rides/ride-card-parts';
import { RideKebabMenu } from '@/components/rides/ride-kebab-menu';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { cn, getRelativeDay } from '@/lib/utils';
import { dateFormats, formatTime, parseLocalDate } from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';

interface LeaderRideData {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  status: string;
  capacity: number | null;
  distance_km: number | null;
  start_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  signup_count: number;
}

interface LeaderRideCardProps {
  ride: LeaderRideData;
  timezone: string;
}

export function LeaderRideCard({ ride, timezone }: LeaderRideCardProps) {
  const prefs = useUserPrefs();
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, null, timezone);
  const cardState = resolveCardState({
    rideStatus: ride.status,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);
  const hasBanner = !!stateStyle.bannerBg;
  const rideDate = parseLocalDate(ride.ride_date);
  const canCancel = lifecycle === 'upcoming' && ride.status !== 'cancelled';

  return (
    <div className="relative">
      <Link
        href={routes.ride(ride.id)}
        className="group block cursor-pointer rounded-(--card-radius) focus-ring transition-[transform,box-shadow] duration-(--duration-normal) ease-(--ease-in-out) hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
      >
        <Card className={cn('overflow-clip p-0', stateStyle.borderClass, stateStyle.glowClass)}>
          <StateCardBanner style={stateStyle} state={cardState} />

          <CardContentSection
            className={cn('px-5 pt-5 pb-5', hasBanner && 'pt-4')}
            date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
            time={formatTime(ride.start_time, prefs.time_format)}
            title={ride.title}
            paceGroupName={ride.pace_group_name}
            paceGroupSortOrder={ride.pace_group_sort_order}
            distanceKm={ride.distance_km}
            locationName={ride.start_location_name}
          />

          <CardFooterSection>
            <div className="flex items-center justify-between gap-4">
              <RiderCount signupCount={ride.signup_count} capacity={ride.capacity} />
            </div>
          </CardFooterSection>
        </Card>
      </Link>

      {/* Kebab menu floated over the card — outside the Link to prevent navigation */}
      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
        <RideKebabMenu rideId={ride.id} canCancel={canCancel} signupCount={ride.signup_count} />
      </div>
    </div>
  );
}
