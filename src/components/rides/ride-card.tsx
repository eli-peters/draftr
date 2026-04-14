'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SPRINGS } from '@/lib/motion';
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
import { useUserPrefs } from '@/components/user-prefs-provider';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { dateFormats, formatTime, parseLocalDate } from '@/config/formatting';
import { getRideAvailability, getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import type { RideWithDetails } from '@/types/database';

const MotionLink = motion.create(Link);

// ---------------------------------------------------------------------------
// RideCard
// ---------------------------------------------------------------------------

interface RideCardProps {
  ride: RideWithDetails;
  variant?: 'home' | 'rides';
  timezone: string;
}

export function RideCard({ ride, variant = 'rides', timezone }: RideCardProps) {
  const prefs = useUserPrefs();
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
  const shouldReduce = useReducedMotion();

  return (
    <MotionLink
      href={routes.ride(ride.id)}
      whileHover={shouldReduce ? undefined : { scale: 1.04 }}
      whileTap={shouldReduce ? undefined : { scale: 0.96 }}
      transition={SPRINGS.gentle}
      className="group block cursor-pointer"
    >
      <Card
        className={cn(
          'overflow-clip p-0',
          isBannerSuppressed ? 'border-border-default' : stateStyle.borderClass,
          !isBannerSuppressed && stateStyle.glowClass,
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
          <HomeLayout
            ride={ride}
            hasBanner={!!stateStyle.bannerBg && !isBannerSuppressed}
            timeFormat={prefs.time_format}
          />
        ) : (
          <RidesLayout
            ride={ride}
            hasBanner={!!stateStyle.bannerBg}
            timezone={timezone}
            timeFormat={prefs.time_format}
          />
        )}
      </Card>
    </MotionLink>
  );
}

// ---------------------------------------------------------------------------
// Home Layout — compact / glanceable
// ---------------------------------------------------------------------------

function HomeLayout({
  ride,
  hasBanner,
  timeFormat,
}: {
  ride: RideWithDetails;
  hasBanner: boolean;
  timeFormat: '12h' | '24h';
}) {
  const rideDate = parseLocalDate(ride.ride_date);

  return (
    <CardContentSection
      className={cn('px-5 pt-5 pb-5', hasBanner && 'pt-4')}
      date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
      time={formatTime(ride.start_time, timeFormat)}
      title={ride.title}
      paceGroupName={ride.pace_group?.name ?? null}
      paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
      locationName={ride.start_location_name ?? null}
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
  timeFormat,
}: {
  ride: RideWithDetails;
  hasBanner: boolean;
  timezone: string;
  timeFormat: '12h' | '24h';
}) {
  const rideDate = parseLocalDate(ride.ride_date);
  const availability = getRideAvailability(ride, ride.rider_count, timezone);

  return (
    <>
      {/* Content section */}
      <CardContentSection
        className={cn('px-5 pt-5 pb-5', hasBanner && 'pt-4')}
        date={getRelativeDay(rideDate, dateFormats.dayShort, true)}
        time={formatTime(ride.start_time, timeFormat)}
        title={ride.title}
        description={ride.description}
        paceGroupName={ride.pace_group?.name ?? null}
        paceGroupSortOrder={ride.pace_group?.sort_order ?? null}
        distanceKm={ride.distance_km}
        locationName={ride.start_location_name ?? null}
        weather={ride.weather}
      />

      {/* Footer section */}
      <CardFooterSection>
        <div className="flex items-center justify-between gap-4">
          <RiderAvatarGroup
            avatars={ride.signup_avatars}
            totalCount={ride.signup_count}
            cancelled={ride.status === 'cancelled'}
            surface="var(--surface-card-footer-soft)"
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
