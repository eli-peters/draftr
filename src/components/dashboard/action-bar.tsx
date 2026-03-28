import Link from 'next/link';
import {
  CalendarDots,
  CloudRain,
  FlagBanner,
  FlagPennant,
  Hourglass,
  Play,
  Timer,
  UserPlus,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CardBanner, CardContentSection } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { formatTime, formatDuration, parseLocalDate } from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { getRelativeDay } from '@/lib/utils';
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
}

interface ActionBarProps {
  nextSignup: NextSignup | null;
  nextLedRide: NextLedRide | null;
  nextWaitlistedRide?: NextWaitlistedRide | null;
  pendingMemberCount?: number;
  ridesNeedingLeaderCount?: number;
  weatherWatchRide?: WeatherWatchRide | null;
  userRole?: UserRole;
}

function ActionCard({
  label,
  icon,
  href,
  bgClass,
  textClass,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  bgClass: string;
  textClass: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="overflow-clip p-0">
        <CardBanner icon={icon} label={label} bgClass={bgClass} textClass={textClass} />
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
  userRole,
}: ActionBarProps) {
  const isAdmin = userRole === 'admin';

  const hasItems =
    nextSignup ||
    nextLedRide ||
    nextWaitlistedRide ||
    (isAdmin && pendingMemberCount > 0) ||
    (isAdmin && ridesNeedingLeaderCount > 0) ||
    weatherWatchRide;

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
          );
          const isStartingSoon = lifecycle === 'about_to_start';
          const isInProgress = lifecycle === 'in_progress';
          const isLive = isStartingSoon || isInProgress;
          const bannerLabel = isInProgress
            ? appContent.rides.status.inProgress
            : isStartingSoon
              ? appContent.rides.status.aboutToStart
              : content.actionBar.yourNextRide;
          const bannerIcon = isInProgress ? Play : isStartingSoon ? Timer : CalendarDots;
          return (
            <ActionCard
              label={bannerLabel}
              icon={bannerIcon}
              href={routes.ride(nextSignup.id)}
              bgClass={isLive ? 'bg-banner-info-bg' : 'bg-banner-success-bg'}
              textClass={isLive ? 'text-banner-info-text' : 'text-banner-success-text'}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextSignup.ride_date))}
                time={formatTime(nextSignup.start_time)}
                title={nextSignup.title}
                paceGroupName={nextSignup.pace_group_name}
                paceGroupSortOrder={nextSignup.pace_group_sort_order}
                distanceKm={nextSignup.distance_km}
                elevationM={nextSignup.elevation_m}
                durationDisplay={formatDuration(nextSignup.start_time, nextSignup.end_time)}
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
              bgClass={waitlistClosed ? 'bg-banner-muted-bg' : 'bg-banner-warning-bg'}
              textClass={waitlistClosed ? 'text-banner-muted-text' : 'text-banner-warning-text'}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextWaitlistedRide.ride_date))}
                time={formatTime(nextWaitlistedRide.start_time)}
                title={nextWaitlistedRide.title}
                paceGroupName={nextWaitlistedRide.pace_group_name}
                paceGroupSortOrder={nextWaitlistedRide.pace_group_sort_order}
                distanceKm={nextWaitlistedRide.distance_km}
                elevationM={nextWaitlistedRide.elevation_m}
                durationDisplay={formatDuration(
                  nextWaitlistedRide.start_time,
                  nextWaitlistedRide.end_time,
                )}
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
          );
          const ledIsLive = ledLifecycle === 'in_progress' || ledLifecycle === 'about_to_start';
          const ledLabel = ledIsLive
            ? ledLifecycle === 'in_progress'
              ? appContent.rides.status.inProgress
              : appContent.rides.status.aboutToStart
            : content.actionBar.nextLedRide;
          const ledIcon = ledIsLive ? (ledLifecycle === 'in_progress' ? Play : Timer) : FlagBanner;
          return (
            <ActionCard
              label={ledLabel}
              icon={ledIcon}
              href={routes.ride(nextLedRide.id)}
              bgClass={ledIsLive ? 'bg-banner-info-bg' : 'bg-banner-secondary-bg'}
              textClass={ledIsLive ? 'text-banner-info-text' : 'text-banner-secondary-text'}
            >
              <CardContentSection
                date={getRelativeDay(parseLocalDate(nextLedRide.ride_date))}
                time={formatTime(nextLedRide.start_time)}
                title={nextLedRide.title}
                paceGroupName={nextLedRide.pace_group_name}
                paceGroupSortOrder={nextLedRide.pace_group_sort_order}
                distanceKm={nextLedRide.distance_km}
                elevationM={nextLedRide.elevation_m}
                durationDisplay={formatDuration(nextLedRide.start_time, nextLedRide.end_time)}
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
          icon={CloudRain}
          href={routes.ride(weatherWatchRide.id)}
          bgClass="bg-banner-warning-bg"
          textClass="text-banner-warning-text"
        >
          <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
            {weatherWatchRide.title}
          </h3>
          <p className="mt-1 text-sm text-warning">
            {content.actionBar.weatherWatchDetail(weatherWatchRide.title)}
          </p>
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
    </div>
  );
}
