import Link from 'next/link';
import { parseISO } from 'date-fns';
import {
  CalendarDots,
  MapPin,
  Users,
  FlagBanner,
  Hourglass,
  UserPlus,
  FlagPennant,
  CloudRain,
  Timer,
  Play,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { CardBanner, DateTimeRow } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { formatTime } from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { getRelativeDay } from '@/lib/utils';
import type { UserRole } from '@/config/navigation';

const { dashboard: content } = appContent;

interface NextSignup {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  signup_count: number;
  capacity: number | null;
}

interface NextLedRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  meeting_location_name: string | null;
  signup_count: number;
  capacity: number | null;
}

interface NextWaitlistedRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  end_time: string | null;
  meeting_location_name: string | null;
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
        <div className="px-5 pt-3 pb-5">{children}</div>
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
              bgClass={isLive ? 'bg-feedback-info-bg' : 'bg-feedback-success-bg'}
              textClass={isLive ? 'text-feedback-info-text' : 'text-feedback-success-text'}
            >
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
                {nextSignup.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <DateTimeRow
                  date={getRelativeDay(parseISO(nextSignup.ride_date))}
                  time={formatTime(nextSignup.start_time)}
                />
                {nextSignup.meeting_location_name && (
                  <MetadataItem icon={MapPin}>{nextSignup.meeting_location_name}</MetadataItem>
                )}
              </div>
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
                  : content.actionBar.waitlistPosition
              }
              icon={Hourglass}
              href={routes.ride(nextWaitlistedRide.id)}
              bgClass={waitlistClosed ? 'bg-muted' : 'bg-feedback-warning-bg'}
              textClass={waitlistClosed ? 'text-muted-foreground' : 'text-feedback-warning-text'}
            >
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
                {nextWaitlistedRide.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <DateTimeRow
                  date={getRelativeDay(parseISO(nextWaitlistedRide.ride_date))}
                  time={formatTime(nextWaitlistedRide.start_time)}
                />
                {nextWaitlistedRide.meeting_location_name && (
                  <MetadataItem icon={MapPin}>
                    {nextWaitlistedRide.meeting_location_name}
                  </MetadataItem>
                )}
                {!waitlistClosed && (
                  <MetadataItem className="text-warning">
                    {appContent.schedule.waitlistPosition(nextWaitlistedRide.waitlist_position)}
                  </MetadataItem>
                )}
              </div>
            </ActionCard>
          );
        })()}

      {/* Leader: next led ride */}
      {nextLedRide && (
        <ActionCard
          label={content.actionBar.nextLedRide}
          icon={FlagBanner}
          href={routes.ride(nextLedRide.id)}
          bgClass="bg-accent-secondary-subtle"
          textClass="text-accent-secondary-default"
        >
          <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
            {nextLedRide.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <DateTimeRow
              date={getRelativeDay(parseISO(nextLedRide.ride_date))}
              time={formatTime(nextLedRide.start_time)}
            />
            {nextLedRide.meeting_location_name && (
              <MetadataItem icon={MapPin}>{nextLedRide.meeting_location_name}</MetadataItem>
            )}
            <MetadataItem icon={Users}>
              {content.actionBar.signedUp(nextLedRide.signup_count, nextLedRide.capacity)}
            </MetadataItem>
          </div>
          <CapacityBar
            signupCount={nextLedRide.signup_count}
            capacity={nextLedRide.capacity}
            className="mt-3"
          />
        </ActionCard>
      )}

      {/* Leader: weather watch */}
      {weatherWatchRide && (
        <ActionCard
          label={content.actionBar.weatherWatch}
          icon={CloudRain}
          href={routes.ride(weatherWatchRide.id)}
          bgClass="bg-feedback-warning-bg"
          textClass="text-feedback-warning-text"
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
