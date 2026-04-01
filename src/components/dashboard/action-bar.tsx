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

interface NextSignup {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  distance_km: number | null;
  elevation_m: number | null;
  signup_count: number;
  capacity: number | null;
  weather: RideWeatherSnapshot | null;
}

interface NextLedRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  distance_km: number | null;
  elevation_m: number | null;
  signup_count: number;
  capacity: number | null;
  weather: RideWeatherSnapshot | null;
}

interface NextWaitlistedRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  elevation_m: number | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  waitlist_position: number;
}

interface WeatherWatchRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  weather: RideWeatherSnapshot | null;
}

interface NextAvailableRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  pace_group_sort_order: number | null;
  weather: RideWeatherSnapshot | null;
}

interface ActionBarProps {
  nextSignup: NextSignup | null;
  nextLedRide: NextLedRide | null;
  nextWaitlistedRide?: NextWaitlistedRide | null;
  pendingMemberCount?: number;
  ridesNeedingLeaderCount?: number;
  weatherWatchRide?: WeatherWatchRide | null;
  nextAvailableRide?: NextAvailableRide | null;
  userRole?: UserRole;
  timezone: string;
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
    <div className="space-y-4">
      {/* Rider: your next confirmed ride */}
      {nextSignup &&
        (() => {
          const lifecycle = getRideLifecycle(
            nextSignup.ride_date,
            nextSignup.start_time,
            nextSignup.end_time,
            timezone,
          );
          const isStartingSoon = lifecycle === 'about_to_start';
          const isInProgress = lifecycle === 'in_progress';
          const isLive = isStartingSoon || isInProgress;
          const bannerLabel = isInProgress
            ? appContent.rides.status.inProgress
            : isStartingSoon
              ? appContent.rides.status.aboutToStart
              : content.actionBar.yourNextRide;
          const bannerIcon = isInProgress
            ? Bicycle
            : isStartingSoon
              ? ClockCountdown
              : CalendarDots;
          return (
            <ActionCard
              label={bannerLabel}
              icon={bannerIcon}
              href={routes.ride(nextSignup.id)}
              bgClass={isLive ? 'bg-banner-soft-info-bg' : 'bg-banner-soft-success-bg'}
              textClass={isLive ? 'text-banner-soft-info-text' : 'text-banner-soft-success-text'}
              borderClass={isLive ? 'border-card-border-info' : 'border-card-border-success'}
              bannerBorderClass={isLive ? 'border-card-border-info' : 'border-card-border-success'}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextSignup.ride_date))}
                time={formatTime(nextSignup.start_time)}
                title={nextSignup.title}
                paceGroupName={nextSignup.pace_group_name}
                paceGroupSortOrder={nextSignup.pace_group_sort_order}
                distanceKm={nextSignup.distance_km}
                locationName={nextSignup.meeting_location_name}
                weather={nextSignup.weather}
              />
            </ActionCard>
          );
        })()}

      {/* Rider: waitlisted ride */}
      {nextWaitlistedRide &&
        (() => {
          const wlLifecycle = getRideLifecycle(
            nextWaitlistedRide.ride_date,
            nextWaitlistedRide.start_time,
            nextWaitlistedRide.end_time,
            timezone,
          );
          const waitlistClosed = wlLifecycle !== 'upcoming';
          return (
            <ActionCard
              label={
                waitlistClosed
                  ? content.actionBar.waitlistClosed
                  : appContent.schedule.status.waitlisted(nextWaitlistedRide.waitlist_position)
              }
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
                locationName={nextWaitlistedRide.meeting_location_name}
              />
            </ActionCard>
          );
        })()}

      {/* Leader: next led ride */}
      {nextLedRide &&
        (() => {
          const ledLifecycle = getRideLifecycle(
            nextLedRide.ride_date,
            nextLedRide.start_time,
            nextLedRide.end_time,
            timezone,
          );
          const ledIsLive = ledLifecycle === 'in_progress' || ledLifecycle === 'about_to_start';
          const ledLabel = ledIsLive
            ? ledLifecycle === 'in_progress'
              ? appContent.rides.status.inProgress
              : appContent.rides.status.aboutToStart
            : content.actionBar.nextLedRide;
          const ledIcon = ledIsLive
            ? ledLifecycle === 'in_progress'
              ? Bicycle
              : ClockCountdown
            : FlagBanner;
          return (
            <ActionCard
              label={ledLabel}
              icon={ledIcon}
              href={routes.ride(nextLedRide.id)}
              bgClass={ledIsLive ? 'bg-banner-soft-info-bg' : 'bg-banner-soft-secondary-bg'}
              textClass={
                ledIsLive ? 'text-banner-soft-info-text' : 'text-banner-soft-secondary-text'
              }
              borderClass={ledIsLive ? 'border-card-border-info' : 'border-border-default'}
              bannerBorderClass={ledIsLive ? 'border-card-border-info' : 'border-border-default'}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextLedRide.ride_date))}
                time={formatTime(nextLedRide.start_time)}
                title={nextLedRide.title}
                paceGroupName={nextLedRide.pace_group_name}
                paceGroupSortOrder={nextLedRide.pace_group_sort_order}
                distanceKm={nextLedRide.distance_km}
                locationName={nextLedRide.meeting_location_name}
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
            locationName={weatherWatchRide.meeting_location_name}
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

      {/* Nudge: next available club ride (shown when rider has no signups) */}
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
            locationName={nextAvailableRide.meeting_location_name}
            weather={nextAvailableRide.weather}
          />
        </ActionCard>
      )}
    </div>
  );
}
