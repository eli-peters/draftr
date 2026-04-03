import Link from 'next/link';
import {
  Bicycle,
  CalendarDots,
  ClockCountdown,
  CloudWarning,
  FlagBanner,
  FlagPennant,
  Hourglass,
  UserPlus,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CardBanner, CardContentSection } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { formatTime, parseLocalDate } from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { cn, getRelativeDay } from '@/lib/utils';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { UserRole } from '@/config/navigation';
import type { RideWeatherSnapshot } from '@/types/database';

const { dashboard: content } = appContent;

/** Shared shape for action bar ride cards. */
interface ActionBarRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  start_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  weather?: RideWeatherSnapshot | null;
}

/** Ride with signup count + capacity (for your-next-ride / led-ride cards). */
interface ActionBarRideWithSignups extends ActionBarRide {
  elevation_m: number | null;
  signup_count: number;
  capacity: number | null;
  weather: RideWeatherSnapshot | null;
}

type NextWaitlistedRide = ActionBarRide & {
  elevation_m: number | null;
  waitlist_position: number;
};

interface ActionBarProps {
  nextSignup: ActionBarRideWithSignups | null;
  nextLedRide: ActionBarRideWithSignups | null;
  nextWaitlistedRide?: NextWaitlistedRide | null;
  pendingMemberCount?: number;
  ridesNeedingLeaderCount?: number;
  weatherWatchRide?: ActionBarRide | null;
  nextAvailableRide?: ActionBarRide | null;
  userRole?: UserRole;
  timezone: string;
}

/**
 * Resolve lifecycle state into banner label, icon, and color classes.
 * Extracts the repeated ternary logic from each ride card block.
 */
function getLifecycleBannerProps(
  ride: { ride_date: string; start_time: string; end_time: string | null },
  timezone: string,
  defaults: {
    label: string;
    icon: PhosphorIcon;
    bgClass: string;
    textClass: string;
    borderClass: string;
  },
) {
  const lifecycle = getRideLifecycle(ride.ride_date, ride.start_time, ride.end_time, timezone);
  const isLive = lifecycle === 'in_progress' || lifecycle === 'about_to_start';

  if (!isLive) return { ...defaults, isLive: false };

  const label =
    lifecycle === 'in_progress'
      ? appContent.rides.status.inProgress
      : appContent.rides.status.aboutToStart;
  const icon = lifecycle === 'in_progress' ? Bicycle : ClockCountdown;

  return {
    label,
    icon,
    bgClass: 'bg-banner-soft-info-bg',
    textClass: 'text-banner-soft-info-text',
    borderClass: 'border-card-border-info',
    isLive: true,
  };
}

function ActionCard({
  label,
  icon,
  href,
  bgClass,
  textClass,
  borderClass,
  bannerBorderClass,
  children,
}: {
  label: string;
  icon: PhosphorIcon;
  href: string;
  bgClass: string;
  textClass: string;
  borderClass?: string;
  bannerBorderClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <Card className={cn('overflow-clip p-0', borderClass)}>
        <CardBanner
          icon={icon}
          label={label}
          bgClass={bgClass}
          textClass={textClass}
          borderClass={bannerBorderClass}
        />
        <div className="px-5 pt-3 pb-4">{children}</div>
      </Card>
    </Link>
  );
}

export function ActionBar({
  nextSignup,
  nextLedRide,
  nextWaitlistedRide,
  pendingMemberCount = 0,
  ridesNeedingLeaderCount = 0,
  weatherWatchRide,
  nextAvailableRide,
  userRole,
  timezone,
}: ActionBarProps) {
  const isAdmin = userRole === 'admin';

  const hasItems =
    nextSignup ||
    nextLedRide ||
    nextWaitlistedRide ||
    (isAdmin && pendingMemberCount > 0) ||
    (isAdmin && ridesNeedingLeaderCount > 0) ||
    weatherWatchRide ||
    nextAvailableRide;

  if (!hasItems) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Rider: your next confirmed ride */}
      {nextSignup &&
        (() => {
          const banner = getLifecycleBannerProps(nextSignup, timezone, {
            label: content.actionBar.yourNextRide,
            icon: CalendarDots,
            bgClass: 'bg-banner-soft-success-bg',
            textClass: 'text-banner-soft-success-text',
            borderClass: 'border-card-border-success',
          });
          return (
            <ActionCard
              label={banner.label}
              icon={banner.icon}
              href={routes.ride(nextSignup.id)}
              bgClass={banner.bgClass}
              textClass={banner.textClass}
              borderClass={banner.borderClass}
              bannerBorderClass={banner.borderClass}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextSignup.ride_date))}
                time={formatTime(nextSignup.start_time)}
                title={nextSignup.title}
                paceGroupName={nextSignup.pace_group_name}
                paceGroupSortOrder={nextSignup.pace_group_sort_order}
                distanceKm={nextSignup.distance_km}
                locationName={nextSignup.start_location_name}
                weather={nextSignup.weather}
              />
            </ActionCard>
          );
        })()}

      {/* Rider: waitlisted ride */}
      {nextWaitlistedRide &&
        (() => {
          const lifecycle = getRideLifecycle(
            nextWaitlistedRide.ride_date,
            nextWaitlistedRide.start_time,
            nextWaitlistedRide.end_time,
            timezone,
          );
          const waitlistClosed = lifecycle !== 'upcoming';
          const label = waitlistClosed
            ? content.actionBar.waitlistClosed
            : appContent.schedule.status.waitlisted(nextWaitlistedRide.waitlist_position);
          return (
            <ActionCard
              label={label}
              icon={Hourglass}
              href={routes.ride(nextWaitlistedRide.id)}
              bgClass={waitlistClosed ? 'bg-banner-muted-bg' : 'bg-banner-soft-warning-bg'}
              textClass={
                waitlistClosed ? 'text-banner-muted-text' : 'text-banner-soft-warning-text'
              }
              borderClass={waitlistClosed ? 'border-border-default' : 'border-card-border-warning'}
              bannerBorderClass={
                waitlistClosed ? 'border-border-default' : 'border-card-border-warning'
              }
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextWaitlistedRide.ride_date))}
                time={formatTime(nextWaitlistedRide.start_time)}
                title={nextWaitlistedRide.title}
                paceGroupName={nextWaitlistedRide.pace_group_name}
                paceGroupSortOrder={nextWaitlistedRide.pace_group_sort_order}
                distanceKm={nextWaitlistedRide.distance_km}
                locationName={nextWaitlistedRide.start_location_name}
              />
            </ActionCard>
          );
        })()}

      {/* Leader: next led ride */}
      {nextLedRide &&
        (() => {
          const banner = getLifecycleBannerProps(nextLedRide, timezone, {
            label: content.actionBar.nextLedRide,
            icon: FlagBanner,
            bgClass: 'bg-banner-soft-secondary-bg',
            textClass: 'text-banner-soft-secondary-text',
            borderClass: 'border-border-default',
          });
          return (
            <ActionCard
              label={banner.label}
              icon={banner.icon}
              href={routes.ride(nextLedRide.id)}
              bgClass={banner.bgClass}
              textClass={banner.textClass}
              borderClass={banner.borderClass}
              bannerBorderClass={banner.borderClass}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextLedRide.ride_date))}
                time={formatTime(nextLedRide.start_time)}
                title={nextLedRide.title}
                paceGroupName={nextLedRide.pace_group_name}
                paceGroupSortOrder={nextLedRide.pace_group_sort_order}
                distanceKm={nextLedRide.distance_km}
                locationName={nextLedRide.start_location_name}
                weather={nextLedRide.weather}
              />
            </ActionCard>
          );
        })()}

      {/* Leader: weather watch */}
      {weatherWatchRide && (
        <ActionCard
          label={content.actionBar.weatherWatch}
          icon={CloudWarning}
          href={routes.ride(weatherWatchRide.id)}
          bgClass="bg-banner-soft-warning-bg"
          textClass="text-banner-soft-warning-text"
          borderClass="border-card-border-warning"
          bannerBorderClass="border-card-border-warning"
        >
          <CardContentSection
            date={getRelativeDay(parseLocalDate(weatherWatchRide.ride_date))}
            time={formatTime(weatherWatchRide.start_time)}
            title={weatherWatchRide.title}
            paceGroupName={weatherWatchRide.pace_group_name}
            paceGroupSortOrder={weatherWatchRide.pace_group_sort_order}
            distanceKm={weatherWatchRide.distance_km}
            locationName={weatherWatchRide.start_location_name}
            weather={weatherWatchRide.weather}
          />
        </ActionCard>
      )}

      {/* Admin: pending member approvals */}
      {isAdmin && pendingMemberCount > 0 && (
        <ActionCard
          label={content.actionBar.pendingApprovals}
          icon={UserPlus}
          href={routes.manageTab('members')}
          bgClass="bg-accent-primary-subtle"
          textClass="text-accent-primary-default"
        >
          <p className="text-sm text-muted-foreground">
            {content.actionBar.pendingApprovalsCount(pendingMemberCount)}
          </p>
        </ActionCard>
      )}

      {/* Admin: rides needing a leader */}
      {isAdmin && ridesNeedingLeaderCount > 0 && (
        <ActionCard
          label={content.actionBar.ridesNeedingLeader}
          icon={FlagPennant}
          href={routes.manageTab('rides')}
          bgClass="bg-accent-primary-subtle"
          textClass="text-accent-primary-default"
        >
          <p className="text-sm text-muted-foreground">
            {content.actionBar.ridesNeedingLeaderCount(ridesNeedingLeaderCount)}
          </p>
        </ActionCard>
      )}

      {/* Next club ride the user doesn't already have a card for */}
      {nextAvailableRide && (
        <ActionCard
          label={content.nudge.heading}
          icon={CalendarDots}
          href={routes.ride(nextAvailableRide.id)}
          bgClass="bg-banner-muted-bg"
          textClass="text-banner-muted-text"
        >
          <CardContentSection
            date={getRelativeDay(parseLocalDate(nextAvailableRide.ride_date))}
            time={formatTime(nextAvailableRide.start_time)}
            title={nextAvailableRide.title}
            paceGroupName={nextAvailableRide.pace_group_name}
            paceGroupSortOrder={nextAvailableRide.pace_group_sort_order}
            distanceKm={nextAvailableRide.distance_km}
            locationName={nextAvailableRide.start_location_name}
            weather={nextAvailableRide.weather}
          />
        </ActionCard>
      )}
    </div>
  );
}
