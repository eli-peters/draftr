'use client';

import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Hourglass } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CardBanner,
  DateTimeRow,
  ScheduleStats,
  CardFooterSection,
} from '@/components/rides/ride-card-parts';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { appContent } from '@/content/app';
import { cn, getRelativeDay } from '@/lib/utils';
import { SignupStatus } from '@/config/statuses';
import { dateFormats, formatTime, formatDuration } from '@/config/formatting';
import { routes } from '@/config/routes';
import type { UserRideSignup } from '@/lib/rides/queries';

const { schedule } = appContent;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleAction = 'cancel-signup' | 'leave-waitlist' | 'get-directions' | 'view-details';

interface ScheduleCardProps {
  ride: UserRideSignup;
  onAction?: (action: ScheduleAction, rideId: string) => void;
}

// ---------------------------------------------------------------------------
// Status banner config
// ---------------------------------------------------------------------------

const statusBannerConfig = {
  confirmed: {
    icon: CheckCircle,
    bgClass: 'bg-feedback-success-bg',
    textClass: 'text-feedback-success-text',
  },
  waitlisted: {
    icon: Hourglass,
    bgClass: 'bg-feedback-warning-bg',
    textClass: 'text-feedback-warning-text',
  },
  completed: {
    icon: CheckCircle,
    bgClass: 'bg-surface-sunken',
    textClass: 'text-muted-foreground',
  },
} as const;

// ---------------------------------------------------------------------------
// ScheduleCard
// ---------------------------------------------------------------------------

export function ScheduleCard({ ride, onAction }: ScheduleCardProps) {
  const router = useRouter();
  const rideDate = parseISO(ride.ride_date);
  const relativeDay = getRelativeDay(rideDate, dateFormats.dayShort);
  const isCompleted = ride.signup_status === SignupStatus.CHECKED_IN;
  const isWaitlisted = ride.signup_status === SignupStatus.WAITLISTED;

  let statusKey: 'completed' | 'waitlisted' | 'confirmed';
  let statusLabel: string;
  if (isCompleted) {
    statusKey = 'completed';
    statusLabel = schedule.status.completed;
  } else if (isWaitlisted) {
    statusKey = 'waitlisted';
    statusLabel = schedule.status.waitlisted(ride.waitlist_position ?? 0);
  } else {
    statusKey = 'confirmed';
    statusLabel = schedule.status.confirmed;
  }
  const bannerConfig = statusBannerConfig[statusKey];

  const durationDisplay = formatDuration(ride.start_time, ride.end_time);

  function handleAction(action: ScheduleAction) {
    if (action === 'view-details' || action === 'get-directions') {
      router.push(routes.ride(ride.id));
      return;
    }
    onAction?.(action, ride.id);
  }

  return (
    <Card className={cn('overflow-clip p-0', isCompleted && 'opacity-completed')}>
      {/* Banner — always present */}
      <CardBanner
        icon={bannerConfig.icon}
        label={statusLabel}
        bgClass={bannerConfig.bgClass}
        textClass={bannerConfig.textClass}
      />

      {/* Content */}
      <div className="flex flex-col gap-4 px-6 pt-3 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <DateTimeRow
              date={`${relativeDay}, ${format(rideDate, dateFormats.monthDay)}`}
              time={formatTime(ride.start_time)}
            />
            <RideWeatherBadge weather={ride.weather} />
          </div>
          {/* heading/md token — 20px */}
          <h3 className="font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
            {ride.title}
          </h3>
        </div>

        <ScheduleStats
          paceGroupName={ride.pace_group_name}
          paceGroupSortOrder={ride.pace_group_sort_order}
          distanceKm={ride.distance_km}
          elevationM={ride.elevation_m}
          durationDisplay={durationDisplay}
        />
      </div>

      {/* Footer */}
      <CardFooterSection>
        <div className="flex items-center justify-between">
          {statusKey === 'confirmed' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
                onClick={() => handleAction('cancel-signup')}
              >
                {schedule.actions.cancelSignup}
              </Button>
              <Button variant="default" size="sm" onClick={() => handleAction('get-directions')}>
                {schedule.actions.getDirections}
              </Button>
            </>
          )}
          {statusKey === 'waitlisted' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
                onClick={() => handleAction('leave-waitlist')}
              >
                {schedule.actions.leaveWaitlist}
              </Button>
              <Button variant="default" size="sm" onClick={() => handleAction('get-directions')}>
                {schedule.actions.getDirections}
              </Button>
            </>
          )}
          {statusKey === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => handleAction('view-details')}>
              {schedule.actions.viewDetails}
            </Button>
          )}
        </div>
      </CardFooterSection>
    </Card>
  );
}
