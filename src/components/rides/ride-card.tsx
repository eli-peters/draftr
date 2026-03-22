import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Users } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RideBanner, DateTimeRow, MetadataStats } from '@/components/rides/ride-card-parts';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { CardSignupButton } from '@/components/rides/card-signup-button';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus } from '@/config/statuses';
import { dateFormats, formatTime } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Shared: PaceAndCount — bottom row with pace badge + rider count
// ---------------------------------------------------------------------------

function PaceAndCount({
  paceGroupName,
  signupCount,
  capacity,
}: {
  paceGroupName: string | null;
  signupCount: number;
  capacity: number | null;
}) {
  if (!paceGroupName && capacity == null) return null;

  const spotsText = capacity != null ? `${signupCount}/${capacity}` : `${signupCount}`;

  return (
    <div className="flex items-center justify-between">
      {paceGroupName ? (
        <Badge variant="secondary" size="sm">
          {paceGroupName}
        </Badge>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1">
        <Users className="size-4 text-muted-foreground" />
        <span className="font-sans text-[0.6875rem] font-semibold text-muted-foreground">
          {spotsText}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  variant?: 'home' | 'rides';
}

export function RideCard({ ride, variant = 'rides' }: RideCardProps) {
  const hasBanner =
    ride.status === RideStatus.WEATHER_WATCH || ride.status === RideStatus.CANCELLED;

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className="mb-4 overflow-clip p-0">
        {hasBanner && (
          <RideBanner
            type={ride.status as typeof RideStatus.WEATHER_WATCH | typeof RideStatus.CANCELLED}
          />
        )}
        {variant === 'home' ? (
          <HomeLayout ride={ride} hasBanner={hasBanner} />
        ) : (
          <RidesLayout ride={ride} hasBanner={hasBanner} />
        )}
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / time-focused
// ---------------------------------------------------------------------------

function HomeLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);

  return (
    <div className={cn('flex flex-col gap-3 px-6', hasBanner ? 'pb-5 pt-4' : 'py-5')}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <DateTimeRow
            date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
            time={formatTime(ride.start_time)}
            isRecurring={!!ride.template_id}
          />
          <RideWeatherBadge weather={ride.weather} />
        </div>
        {/* heading/sm token */}
        <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
          {ride.title}
        </h3>
      </div>

      <MetadataStats distanceKm={ride.distance_km} elevationM={ride.elevation_m} />

      <PaceAndCount
        paceGroupName={ride.pace_group?.name ?? null}
        signupCount={ride.signup_count}
        capacity={ride.capacity}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rides Layout — rich / decision-making
// ---------------------------------------------------------------------------

function RidesLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const spotsRemaining = ride.capacity != null ? ride.capacity - ride.signup_count : null;
  const leaderName = ride.creator?.display_name ?? ride.creator?.full_name ?? null;

  return (
    <div className={cn('flex flex-col gap-3 px-6', hasBanner ? 'pb-6 pt-4' : 'p-6')}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <DateTimeRow
            date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
            time={formatTime(ride.start_time)}
            isRecurring={!!ride.template_id}
          />
          <RideWeatherBadge weather={ride.weather} />
        </div>
        {/* heading/md token */}
        <h3 className="font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
          {ride.title}
        </h3>
      </div>

      {ride.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{ride.description}</p>
      )}

      <MetadataStats distanceKm={ride.distance_km} elevationM={ride.elevation_m} />

      <PaceAndCount
        paceGroupName={ride.pace_group?.name ?? null}
        signupCount={ride.signup_count}
        capacity={ride.capacity}
      />

      <div className="h-px w-full bg-border" />

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
          {leaderName && <span className="truncate">{ridesContent.card.ledBy(leaderName)}</span>}
        </div>
        <CardSignupButton
          rideId={ride.id}
          rideName={ride.title}
          isFull={ride.capacity != null && ride.signup_count >= ride.capacity}
          userStatus={ride.current_user_signup_status}
        />
      </div>
    </div>
  );
}
