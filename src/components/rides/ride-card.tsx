import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  BODY_SM,
  LABEL_SM,
  RideBanner,
  DateTimeRow,
  InlineMetadata,
  RiderCount,
  CardFooterSection,
} from '@/components/rides/ride-card-parts';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { CardSignupButton } from '@/components/rides/card-signup-button';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus } from '@/config/statuses';
import { dateFormats, formatTime, units, getPaceBadgeVariant } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

const MAX_VISIBLE_TAGS = 3;

// ---------------------------------------------------------------------------
// PaceAndTagRow — Rides variant: pace badge + distance + vibe tags inline
// ---------------------------------------------------------------------------

function PaceAndTagRow({
  paceGroupName,
  paceGroupSortOrder,
  distanceKm,
  tags,
}: {
  paceGroupName: string | null;
  paceGroupSortOrder: number | null;
  distanceKm: number | null;
  tags: { id: string; name: string }[];
}) {
  const hasAny = paceGroupName || distanceKm != null || tags.length > 0;
  if (!hasAny) return null;

  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {paceGroupName && (
        <Badge
          variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
          size="sm"
        >
          {paceGroupName}
        </Badge>
      )}
      {distanceKm != null && (
        <span className={cn(BODY_SM, 'text-muted-foreground')}>
          {distanceKm}{units.km}
        </span>
      )}
      {visible.map((tag) => (
        <Badge key={tag.id} variant="vibe" size="sm">
          {tag.name}
        </Badge>
      ))}
      {overflow > 0 && (
        <span className="text-xs text-muted-foreground">
          {ridesContent.card.moreTags(overflow)}
        </span>
      )}
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

  const isHome = variant === 'home';

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card className={cn('overflow-clip p-0', isHome && 'border-border-subtle')}>
        {hasBanner && (
          <RideBanner
            type={ride.status as typeof RideStatus.WEATHER_WATCH | typeof RideStatus.CANCELLED}
          />
        )}
        {isHome ? (
          <HomeLayout ride={ride} hasBanner={hasBanner} />
        ) : (
          <RidesLayout ride={ride} hasBanner={hasBanner} />
        )}
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / glanceable
// ---------------------------------------------------------------------------

function HomeLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);

  return (
    <div className={cn('flex flex-col gap-3 p-4', hasBanner && 'pt-3')}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <DateTimeRow
            date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
            time={formatTime(ride.start_time)}
            isRecurring={!!ride.template_id}
          />
          <RideWeatherBadge weather={ride.weather} />
        </div>
        {/* heading/md token — 20px */}
        <h3 className="font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
          {ride.title}
        </h3>
      </div>

      <InlineMetadata
        paceGroupName={ride.pace_group?.name ?? null}
        paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
        distanceKm={ride.distance_km}
        locationName={ride.meeting_location?.name ?? null}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rides Layout — rich / decision-making (two-section: content + footer)
// ---------------------------------------------------------------------------

function RidesLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const leaderName = ride.creator?.display_name ?? ride.creator?.full_name ?? null;

  return (
    <>
      {/* Content section */}
      <div className={cn('flex flex-col gap-3 p-6', hasBanner && 'pt-4')}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <DateTimeRow
              date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
              time={formatTime(ride.start_time)}
              isRecurring={!!ride.template_id}
            />
            <RideWeatherBadge weather={ride.weather} />
          </div>
          {/* heading/md token — 20px */}
          <h3 className="font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
            {ride.title}
          </h3>
        </div>

        {ride.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{ride.description}</p>
        )}

        <PaceAndTagRow
          paceGroupName={ride.pace_group?.name ?? null}
          paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
          distanceKm={ride.distance_km}
          tags={ride.tags}
        />
      </div>

      {/* Footer section */}
      <CardFooterSection>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <RiderCount signupCount={ride.signup_count} capacity={ride.capacity} />
            {leaderName && (
              <span className={cn(LABEL_SM, 'text-muted-foreground')}>
                {ridesContent.card.ledBy(leaderName)}
              </span>
            )}
          </div>
          <CardSignupButton
            rideId={ride.id}
            rideName={ride.title}
            isFull={ride.capacity != null && ride.signup_count >= ride.capacity}
            userStatus={ride.current_user_signup_status}
          />
        </div>
      </CardFooterSection>
    </>
  );
}
