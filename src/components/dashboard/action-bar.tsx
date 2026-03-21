import Link from 'next/link';
import { parseISO } from 'date-fns';
import {
  CalendarDots,
  MapPin,
  Users,
  FlagBanner,
  CaretRight,
  Queue,
  UserPlus,
  FlagPennant,
  CloudRain,
} from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/card';
import { CapacityBar } from '@/components/ui/capacity-bar';
import { MetadataItem } from '@/components/ui/metadata-item';
import { OVERLINE } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { separators, formatTime } from '@/config/formatting';
import { routes } from '@/config/routes';
import { getRelativeDay } from '@/lib/utils';
import type { UserRole } from '@/config/navigation';

const { dashboard: content } = appContent;

interface NextSignup {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
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
  icon: Icon,
  href,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ weight?: 'duotone' | 'fill'; className?: string }>;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className={`${OVERLINE} text-muted-foreground`}>{label}</span>
          <CaretRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
        </div>
        {children}
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
    <div className="space-y-3">
      {/* Rider: your next confirmed ride */}
      {nextSignup && (
        <ActionCard
          label={content.actionBar.yourNextRide}
          icon={CalendarDots}
          href={routes.ride(nextSignup.id)}
        >
          <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
            {nextSignup.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className={`${OVERLINE} text-primary`}>
              {getRelativeDay(parseISO(nextSignup.ride_date))}
              {separators.dot}
              {formatTime(nextSignup.start_time)}
            </span>
            {nextSignup.meeting_location_name && (
              <MetadataItem icon={MapPin}>{nextSignup.meeting_location_name}</MetadataItem>
            )}
          </div>
        </ActionCard>
      )}

      {/* Rider: waitlisted ride */}
      {nextWaitlistedRide && (
        <ActionCard
          label={content.actionBar.waitlistPosition}
          icon={Queue}
          href={routes.ride(nextWaitlistedRide.id)}
        >
          <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
            {nextWaitlistedRide.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className={`${OVERLINE} text-primary`}>
              {getRelativeDay(parseISO(nextWaitlistedRide.ride_date))}
              {separators.dot}
              {formatTime(nextWaitlistedRide.start_time)}
            </span>
            <MetadataItem className="text-warning">
              {appContent.myRides.waitlistPosition(nextWaitlistedRide.waitlist_position)}
            </MetadataItem>
          </div>
        </ActionCard>
      )}

      {/* Leader: next led ride */}
      {nextLedRide && (
        <ActionCard
          label={content.actionBar.nextLedRide}
          icon={FlagBanner}
          href={routes.ride(nextLedRide.id)}
        >
          <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
            {nextLedRide.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className={`${OVERLINE} text-primary`}>
              {getRelativeDay(parseISO(nextLedRide.ride_date))}
              {separators.dot}
              {formatTime(nextLedRide.start_time)}
            </span>
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

      {/* Leader: weather watch stub */}
      {weatherWatchRide && (
        <ActionCard
          label={content.actionBar.weatherWatch}
          icon={CloudRain}
          href={routes.ride(weatherWatchRide.id)}
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
        >
          <p className="text-sm text-muted-foreground">
            {content.actionBar.ridesNeedingLeaderCount(ridesNeedingLeaderCount)}
          </p>
        </ActionCard>
      )}
    </div>
  );
}
