import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  CardContentSection,
  CardFooterSection,
  StateCardBanner,
  RiderAvatarGroup,
  getCardStateStyle,
  resolveCardState,
  type CardState,
} from '@/components/rides/ride-card-parts';
import { CardSignupButton } from '@/components/rides/card-signup-button';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { dateFormats, formatTime, parseLocalDate } from '@/config/formatting';
import { getRideAvailability, getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  variant?: 'home' | 'rides';
  timezone: string;
}

export function RideCard({ ride, variant = 'rides', timezone }: RideCardProps) {
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time, timezone);
  const cardState = resolveCardState({
    rideStatus: ride.status,
    signupStatus: ride.current_user_signup_status,
    lifecycle,
  });
  const stateStyle = getCardStateStyle(cardState);

  const isHome = variant === 'home';
  const homeSuppressed: CardState[] = ['confirmed'];
  const isBannerSuppressed = isHome && homeSuppressed.includes(cardState);

  return (
    <Link href={routes.ride(ride.id)} className="group block">
      <Card
        className={cn(
          'overflow-clip p-0',
          isBannerSuppressed ? 'border-border-default' : stateStyle.borderClass,
        )}
      >
        <StateCardBanner
          style={stateStyle}
          state={cardState}
          suppressStates={isHome ? homeSuppressed : undefined}
          labelOverride={
            cardState === 'waitlisted' && ride.current_user_waitlist_position
              ? appContent.schedule.status.waitlisted(ride.current_user_waitlist_position)
              : undefined
          }
        />
        {isHome ? (
          <HomeLayout ride={ride} hasBanner={!!stateStyle.bannerBg && !isBannerSuppressed} />
        ) : (
          <RidesLayout ride={ride} hasBanner={!!stateStyle.bannerBg} timezone={timezone} />
        )}
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / glanceable
// ---------------------------------------------------------------------------

function HomeLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseLocalDate(ride.ride_date);

  return (
    <CardContentSection
      className={cn('px-5 pt-5 pb-5', hasBanner && 'pt-4')}
      date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
      time={formatTime(ride.start_time)}
      isRecurring={!!ride.template_id}
      title={ride.title}
      paceGroupName={ride.pace_group?.name ?? null}
      paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
      locationName={ride.start_location_name ?? ride.meeting_location?.name ?? null}
      weather={ride.weather}
    />
  );
}

// ---------------------------------------------------------------------------
// Rides Layout — rich / decision-making (two-section: content + footer)
// ---------------------------------------------------------------------------

function RidesLayout({
  ride,
  hasBanner,
  timezone,
}: {
  ride: RideWithDetails;
  hasBanner: boolean;
  timezone: string;
}) {
  const rideDate = parseLocalDate(ride.ride_date);
  const availability = getRideAvailability(ride, ride.signup_count, timezone);

  return (
    <>
      {/* Content section */}
      <CardContentSection
        className={cn('px-5 pt-5 pb-5', hasBanner && 'pt-4')}
        date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
        time={formatTime(ride.start_time)}
        isRecurring={!!ride.template_id}
        title={ride.title}
        description={ride.description}
        paceGroupName={ride.pace_group?.name ?? null}
        paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
        distanceKm={ride.distance_km}
        locationName={ride.start_location_name ?? ride.meeting_location?.name ?? null}
        weather={ride.weather}
      />

      {/* Footer section */}
      <CardFooterSection>
        <div className="flex items-center justify-between gap-4">
          <RiderAvatarGroup
            avatars={ride.signup_avatars}
            totalCount={ride.signup_count}
            cancelled={ride.status === 'cancelled'}
          />
          {availability.canSignUp && (
            <CardSignupButton
              rideId={ride.id}
              rideName={ride.title}
              isFull={availability.isFull}
              userStatus={ride.current_user_signup_status}
            />
          )}
        </div>
      </CardFooterSection>
    </>
  );
}
