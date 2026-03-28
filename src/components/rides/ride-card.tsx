import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle, Hourglass, Play, Timer } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import {
  LABEL_SM,
  CardBanner,
  RideBanner,
  CardContentSection,
  CardFooterSection,
  RiderCount,
} from '@/components/rides/ride-card-parts';
import { CardSignupButton } from '@/components/rides/card-signup-button';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { RideStatus, SignupStatus } from '@/config/statuses';
import { dateFormats, formatTime, formatDuration, parseLocalDate } from '@/config/formatting';
import { getRideAvailability, getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const { rides: ridesContent } = appContent;

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
  const rideDate = parseLocalDate(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);

  return (
    <CardContentSection
      className={cn('px-5 pt-4 pb-5', hasBanner && 'pt-3')}
      date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
      time={formatTime(ride.start_time)}
      isRecurring={!!ride.template_id}
      title={ride.title}
      paceGroupName={ride.pace_group?.name ?? null}
      paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
      distanceKm={ride.distance_km}
      elevationM={ride.elevation_m}
      durationDisplay={formatDuration(ride.start_time, ride.end_time)}
      locationName={ride.meeting_location?.name ?? null}
      weather={ride.weather}
    />
  );
}

// ---------------------------------------------------------------------------
// Rides Layout — rich / decision-making (two-section: content + footer)
// ---------------------------------------------------------------------------

function RidesLayout({ ride, hasBanner }: { ride: RideWithDetails; hasBanner: boolean }) {
  const rideDate = parseLocalDate(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const leaderName = ride.creator?.display_name ?? ride.creator?.full_name ?? null;
  const availability = getRideAvailability(ride, ride.signup_count);
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time);
  const userStatus = ride.current_user_signup_status;
  const hasSignupBanner =
    userStatus === SignupStatus.CONFIRMED || userStatus === SignupStatus.WAITLISTED;
  const isLive = lifecycle === 'in_progress' || lifecycle === 'about_to_start';
  const hasAnyBanner = hasBanner || hasSignupBanner;

  // Resolve the signup/lifecycle banner (lifecycle overrides signup status)
  const signupBanner =
    hasSignupBanner && isLive
      ? {
          icon: lifecycle === 'in_progress' ? Play : Timer,
          label:
            lifecycle === 'in_progress'
              ? appContent.rides.status.inProgress
              : appContent.rides.status.aboutToStart,
          bgClass: 'bg-banner-soft-info-bg',
          textClass: 'text-banner-soft-info-text',
        }
      : hasSignupBanner
        ? {
            icon: userStatus === SignupStatus.CONFIRMED ? CheckCircle : Hourglass,
            label:
              userStatus === SignupStatus.CONFIRMED
                ? ridesContent.card.signedUp
                : ride.current_user_waitlist_position
                  ? appContent.schedule.status.waitlisted(ride.current_user_waitlist_position)
                  : ridesContent.card.waitlisted,
            bgClass:
              userStatus === SignupStatus.CONFIRMED
                ? 'bg-banner-soft-success-bg'
                : 'bg-banner-soft-warning-bg',
            textClass:
              userStatus === SignupStatus.CONFIRMED
                ? 'text-banner-soft-success-text'
                : 'text-banner-soft-warning-text',
          }
        : null;

  return (
    <>
      {/* Signup/lifecycle banner — lifecycle overrides signup status */}
      {signupBanner && (
        <CardBanner
          icon={signupBanner.icon}
          label={signupBanner.label}
          bgClass={signupBanner.bgClass}
          textClass={signupBanner.textClass}
        />
      )}

      {/* Content section */}
      <CardContentSection
        className={cn('px-5 pt-4 pb-5', hasAnyBanner && 'pt-3')}
        date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
        time={formatTime(ride.start_time)}
        isRecurring={!!ride.template_id}
        title={ride.title}
        description={ride.description}
        paceGroupName={ride.pace_group?.name ?? null}
        paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
        distanceKm={ride.distance_km}
        elevationM={ride.elevation_m}
        durationDisplay={formatDuration(ride.start_time, ride.end_time)}
        locationName={ride.meeting_location?.name ?? null}
        weather={ride.weather}
      />

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
