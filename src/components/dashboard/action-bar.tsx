'use client';

import Link from 'next/link';
import {
  FlagBanner,
  FlagPennant,
  HandsPraying,
  MapPin,
  UserPlus,
} from '@phosphor-icons/react/dist/ssr';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { DURATIONS, EASE, SPRINGS } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import {
  DateTimeRow,
  RiderAvatarGroup,
  StateCardShell,
  getCardStateStyle,
  resolveCardState,
  type CardStateStyle,
} from '@/components/rides/ride-card-parts';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { appContent } from '@/content/app';
import {
  formatDistance,
  formatTime,
  getPaceBadgeVariant,
  parseLocalDate,
} from '@/config/formatting';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { routes } from '@/config/routes';
import { RideStatus, SignupStatus } from '@/config/statuses';
import { cn, getRelativeDay } from '@/lib/utils';
import type { UserRole } from '@/config/navigation';
import type { RideWeatherSnapshot, SignupAvatar } from '@/types/database';

const STATUS_ICON_CLASS = 'size-3.5 shrink-0 text-status-label-text';
const HERO_CONTENT_CLASS = 'px-5 py-5';

/**
 * Hero ride card content — stacked rows with a magenta uppercase date/time
 * eyebrow, the name on its own full-width line, pace/distance, and an
 * optional location + countdown row. Mirrors list card DNA where they
 * overlap (pace + distance, type scale) while letting the name breathe.
 *
 * §6 Weather: inline weather intentionally omitted — it lives above the
 * card in the greeting/intro section on the homepage.
 */
function HeroCardContent({
  title,
  date,
  time,
  paceGroupName,
  paceGroupSortOrder,
  distanceKm,
  locationName,
  countdown,
}: {
  title: string;
  date: string;
  time: string;
  paceGroupName: string | null;
  paceGroupSortOrder: number | null;
  distanceKm: number | null;
  locationName: string | null;
  countdown: string | null;
}) {
  const prefs = useUserPrefs();
  const hasBottomRow = Boolean(locationName || countdown);

  return (
    <div className={cn('flex flex-col gap-3', HERO_CONTENT_CLASS)}>
      <div className="flex flex-col gap-1">
        <DateTimeRow date={date} time={time} />
        <h3 className="truncate font-sans text-xl font-bold text-foreground">{title}</h3>
      </div>

      <div className="flex items-center justify-between gap-3">
        {paceGroupName ? (
          <Badge
            variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
          >
            {paceGroupName}
          </Badge>
        ) : (
          <span />
        )}
        {distanceKm != null && (
          <span className="shrink-0 font-sans text-base font-bold text-foreground tabular-nums">
            {formatDistance(distanceKm, prefs.distance_unit)}
          </span>
        )}
      </div>

      {hasBottomRow && (
        <div className="flex items-center justify-between gap-3">
          {locationName ? (
            <span className="flex min-w-0 items-center gap-1.5 font-sans text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{locationName}</span>
            </span>
          ) : (
            <span />
          )}
          {countdown && (
            <span className="shrink-0 font-sans text-sm text-muted-foreground">{countdown}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Short "in X hours" / "in 3 days" string for upcoming rides. Returns null
 * for rides that aren't `upcoming` or `about_to_start` — we don't want
 * countdowns on live or finished rides.
 */
function rideCountdown(
  rideDate: string,
  startTime: string,
  lifecycle: ReturnType<typeof getRideLifecycle>,
): string | null {
  if (lifecycle !== 'upcoming' && lifecycle !== 'about_to_start') return null;
  const dt = new Date(`${rideDate}T${startTime}`);
  if (Number.isNaN(dt.getTime())) return null;
  return formatDistanceToNowStrict(dt, { addSuffix: true });
}

function heroContentFor(
  ride: ActionBarRide,
  dateLabel: string,
  timeFormat: '12h' | '24h',
  countdown: string | null,
) {
  return (
    <HeroCardContent
      title={ride.title}
      date={dateLabel}
      time={formatTime(ride.start_time, timeFormat)}
      paceGroupName={ride.pace_group_name}
      paceGroupSortOrder={ride.pace_group_sort_order}
      distanceKm={ride.distance_km}
      locationName={ride.start_location_name}
      countdown={countdown}
    />
  );
}

const MotionLink = motion.create(Link);

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
  signup_count: number;
  signup_avatars: SignupAvatar[];
}

/** Ride with capacity + elevation (for your-next-ride / led-ride cards). */
interface ActionBarRideWithSignups extends ActionBarRide {
  elevation_m: number | null;
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
  userRole?: UserRole;
  timezone: string;
}

/**
 * Build a CardStateStyle for concerns that don't map to a ride CardState
 * (led-ride framing, admin nudges, closed waitlist). Ride-state-driven cards
 * use getCardStateStyle(resolveCardState(...)).
 */
function concernStyle(bgClass: string, icon: React.ReactNode, label: string): CardStateStyle {
  return {
    borderClass: 'border-border-default',
    bannerBorderClass: null,
    bannerBg: bgClass,
    bannerIcon: icon,
    bannerLabel: label,
    glowClass: null,
  };
}

/**
 * If the ride is live (in_progress / about_to_start) the lifecycle urgency
 * state takes over; otherwise fall back to the caller's concern framing.
 */
function liveOrConcern(
  lifecycle: ReturnType<typeof getRideLifecycle>,
  fallback: CardStateStyle,
): CardStateStyle {
  const state = resolveCardState({ lifecycle });
  return state === 'default' ? fallback : getCardStateStyle(state);
}

function rideFooter(ride: { signup_avatars: SignupAvatar[]; signup_count: number }) {
  return (
    <RiderAvatarGroup
      avatars={ride.signup_avatars}
      totalCount={ride.signup_count}
      surface="var(--surface-card-footer-soft)"
    />
  );
}

/**
 * Motion wrapper shared by every action-bar card. Renders the section
 * heading outside the card per §2, keeps staggered entrance + hover dim.
 */
function ActionCardShell({
  heading,
  href,
  stateStyle,
  stripeLabelOverride,
  children,
  footer,
}: {
  heading: string;
  href: string;
  stateStyle: CardStateStyle;
  stripeLabelOverride?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col gap-3"
      variants={{
        hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATIONS.normal, ease: EASE.out },
        },
      }}
    >
      <h2 className="font-display text-xl font-semibold text-foreground">{heading}</h2>
      <div className="transition-opacity duration-(--duration-normal) group-hover:opacity-40 hover:!opacity-100">
        <MotionLink
          href={href}
          whileHover={shouldReduce ? undefined : { scale: 1.04 }}
          whileTap={shouldReduce ? undefined : { scale: 0.96 }}
          transition={SPRINGS.gentle}
          className="group block cursor-pointer"
        >
          <StateCardShell
            stateStyle={stateStyle}
            stripeLabelOverride={stripeLabelOverride}
            footer={footer}
          >
            {children}
          </StateCardShell>
        </MotionLink>
      </div>
    </motion.div>
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
  timezone,
}: ActionBarProps) {
  const prefs = useUserPrefs();
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
      }}
      className="group flex flex-col gap-8"
    >
      {/* Rider: your next confirmed ride */}
      {nextSignup &&
        (() => {
          const lifecycle = getRideLifecycle(
            nextSignup.ride_date,
            nextSignup.start_time,
            nextSignup.end_time,
            timezone,
          );
          const cardState = resolveCardState({
            signupStatus: SignupStatus.CONFIRMED,
            lifecycle,
          });
          const stateStyle = getCardStateStyle(cardState);
          return (
            <ActionCardShell
              heading={content.actionBar.yourNextRide}
              href={routes.ride(nextSignup.id)}
              stateStyle={stateStyle}
              footer={rideFooter(nextSignup)}
            >
              {heroContentFor(
                nextSignup,
                getRelativeDay(parseLocalDate(nextSignup.ride_date)),
                prefs.time_format,
                rideCountdown(nextSignup.ride_date, nextSignup.start_time, lifecycle),
              )}
            </ActionCardShell>
          );
        })()}

      {/* Rider: waitlisted ride */}
      {/* Round 2 §4/§7 TODO: step 4 single-card consolidation may fold this into "Your Next Ride" */}
      {nextWaitlistedRide &&
        (() => {
          const lifecycle = getRideLifecycle(
            nextWaitlistedRide.ride_date,
            nextWaitlistedRide.start_time,
            nextWaitlistedRide.end_time,
            timezone,
          );
          const waitlistClosed = lifecycle !== 'upcoming';
          const stateStyle = waitlistClosed
            ? concernStyle(
                'bg-status-completed-bg',
                <HandsPraying weight="fill" className={STATUS_ICON_CLASS} />,
                content.actionBar.waitlistClosed,
              )
            : getCardStateStyle(resolveCardState({ signupStatus: SignupStatus.WAITLISTED }));
          const waitlistedLabel = waitlistClosed
            ? content.actionBar.waitlistClosed
            : appContent.schedule.status.waitlisted(nextWaitlistedRide.waitlist_position);
          return (
            <ActionCardShell
              heading={waitlistedLabel}
              href={routes.ride(nextWaitlistedRide.id)}
              stateStyle={stateStyle}
              stripeLabelOverride={waitlistClosed ? undefined : waitlistedLabel}
              footer={rideFooter(nextWaitlistedRide)}
            >
              {heroContentFor(
                nextWaitlistedRide,
                getRelativeDay(parseLocalDate(nextWaitlistedRide.ride_date)),
                prefs.time_format,
                rideCountdown(
                  nextWaitlistedRide.ride_date,
                  nextWaitlistedRide.start_time,
                  lifecycle,
                ),
              )}
            </ActionCardShell>
          );
        })()}

      {/* Leader: next led ride */}
      {nextLedRide &&
        (() => {
          const lifecycle = getRideLifecycle(
            nextLedRide.ride_date,
            nextLedRide.start_time,
            nextLedRide.end_time,
            timezone,
          );
          const stateStyle = liveOrConcern(
            lifecycle,
            concernStyle(
              'bg-status-ledRide-bg',
              <FlagBanner weight="fill" className={STATUS_ICON_CLASS} />,
              content.actionBar.nextLedRide,
            ),
          );
          return (
            <ActionCardShell
              heading={content.actionBar.nextLedRide}
              href={routes.ride(nextLedRide.id)}
              stateStyle={stateStyle}
              footer={rideFooter(nextLedRide)}
            >
              {heroContentFor(
                nextLedRide,
                getRelativeDay(parseLocalDate(nextLedRide.ride_date)),
                prefs.time_format,
                rideCountdown(nextLedRide.ride_date, nextLedRide.start_time, lifecycle),
              )}
            </ActionCardShell>
          );
        })()}

      {/* Leader: weather watch */}
      {/* Round 2 §1 TODO: homepage scope is strictly rider's own rides — revisit whether this leader-facing concern belongs here */}
      {weatherWatchRide &&
        (() => {
          const lifecycle = getRideLifecycle(
            weatherWatchRide.ride_date,
            weatherWatchRide.start_time,
            weatherWatchRide.end_time,
            timezone,
          );
          return (
            <ActionCardShell
              heading={content.actionBar.weatherWatch}
              href={routes.ride(weatherWatchRide.id)}
              stateStyle={getCardStateStyle(
                resolveCardState({ rideStatus: RideStatus.WEATHER_WATCH }),
              )}
              footer={rideFooter(weatherWatchRide)}
            >
              {heroContentFor(
                weatherWatchRide,
                getRelativeDay(parseLocalDate(weatherWatchRide.ride_date)),
                prefs.time_format,
                rideCountdown(weatherWatchRide.ride_date, weatherWatchRide.start_time, lifecycle),
              )}
            </ActionCardShell>
          );
        })()}

      {/* Admin: pending member approvals */}
      {/* Round 2 §1 TODO: admin concerns aren't "rides" — revisit homepage placement */}
      {isAdmin && pendingMemberCount > 0 && (
        <ActionCardShell
          heading={content.actionBar.pendingApprovals}
          href={routes.manageTab('members')}
          stateStyle={concernStyle(
            'bg-status-adminNudge-bg',
            <UserPlus weight="fill" className={STATUS_ICON_CLASS} />,
            content.actionBar.pendingApprovals,
          )}
        >
          <p className={cn(HERO_CONTENT_CLASS, 'text-sm text-muted-foreground')}>
            {content.actionBar.pendingApprovalsCount(pendingMemberCount)}
          </p>
        </ActionCardShell>
      )}

      {/* Admin: rides needing a leader */}
      {/* Round 2 §1 TODO: admin concerns aren't "rides" — revisit homepage placement */}
      {isAdmin && ridesNeedingLeaderCount > 0 && (
        <ActionCardShell
          heading={content.actionBar.ridesNeedingLeader}
          href={routes.manageTab('rides')}
          stateStyle={concernStyle(
            'bg-status-adminNudge-bg',
            <FlagPennant weight="fill" className={STATUS_ICON_CLASS} />,
            content.actionBar.ridesNeedingLeader,
          )}
        >
          <p className={cn(HERO_CONTENT_CLASS, 'text-sm text-muted-foreground')}>
            {content.actionBar.ridesNeedingLeaderCount(ridesNeedingLeaderCount)}
          </p>
        </ActionCardShell>
      )}
    </motion.div>
  );
}
