'use client';

import {
  Alarm,
  CheckFat,
  Clock,
  CloudWarning,
  HandsPraying,
  MapPin,
  Mountains,
  Path,
  ProhibitInset,
  Smiley,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { useUserPrefs } from '@/components/user-prefs-provider';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import {
  separators,
  formatDistance,
  formatElevation,
  getPaceBadgeVariant,
} from '@/config/formatting';
import { RideStatus, SignupStatus } from '@/config/statuses';
import type { RideWeatherSnapshot, SignupAvatar } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Shared styles — design system token classes
// ---------------------------------------------------------------------------

/** overline token: 11→12 px fluid, semibold, uppercase, tracked */
export const OVERLINE = 'font-sans text-overline font-semibold uppercase tracking-[0.06em]';

/** body/sm token: 13→14 px fluid, regular weight */
export const BODY_SM = 'font-sans text-xs';

/** label/sm token: same size as overline, without uppercase */
export const LABEL_SM = 'font-sans text-overline';

/** caption/sm token: 10→11 px fluid, mono for small data labels */
export const CAPTION_SM = 'font-sans text-caption-sm';

/** data/sm token: 12→13 px fluid, mono, regular weight */
export const DATA_SM = 'font-sans text-xs';

// ---------------------------------------------------------------------------
// Card state style — unified visual state for all card types
// ---------------------------------------------------------------------------

export type CardState =
  | 'confirmed'
  | 'waitlisted'
  | 'weather_watch'
  | 'cancelled'
  | 'in_progress'
  | 'about_to_start'
  | 'completed'
  | 'default';

export interface CardStateStyle {
  /** Muted status border for the card outline (300 light / 700 dark) */
  borderClass: string;
  /** Status-coloured stroke between banner and content, if any */
  bannerBorderClass: string | null;
  bannerBg: string | null;
  bannerIcon: React.ReactNode | null;
  bannerLabel: string | null;
  /** Dark-mode colored glow shadow (subtle halo around status cards) */
  glowClass: string | null;
}

const STATUS_ICON_CLASS = 'size-3.5 shrink-0 text-status-label-text';

export function getCardStateStyle(state: CardState): CardStateStyle {
  switch (state) {
    case 'confirmed':
      return {
        borderClass: 'border-card-border-success',
        bannerBorderClass: null,
        bannerBg: 'bg-status-confirmed-bg',
        bannerIcon: <CheckFat weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.card.signedUp,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-success)]',
      };
    case 'waitlisted':
      return {
        borderClass: 'border-card-border-warning',
        bannerBorderClass: null,
        bannerBg: 'bg-status-waitlisted-bg',
        bannerIcon: <HandsPraying weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.card.waitlisted,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-warning)]',
      };
    case 'weather_watch':
      return {
        borderClass: 'border-card-border-warning',
        bannerBorderClass: null,
        bannerBg: 'bg-status-weatherWatch-bg',
        bannerIcon: <CloudWarning weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.status.weatherWatch,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-warning)]',
      };
    case 'cancelled':
      return {
        borderClass: 'border-card-border-error',
        bannerBorderClass: null,
        bannerBg: 'bg-status-cancelled-bg',
        bannerIcon: <ProhibitInset weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.status.cancelled,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-error)]',
      };
    case 'in_progress':
      return {
        borderClass: 'border-card-border-info',
        bannerBorderClass: null,
        bannerBg: 'bg-status-inProgress-bg',
        bannerIcon: <PulsatingDot />,
        bannerLabel: ridesContent.status.inProgress,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-info)]',
      };
    case 'about_to_start':
      return {
        borderClass: 'border-card-border-info',
        bannerBorderClass: null,
        bannerBg: 'bg-status-aboutToStart-bg',
        bannerIcon: <Alarm weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.status.aboutToStart,
        glowClass: 'dark:shadow-[shadow:var(--card-shadow),var(--card-glow-info)]',
      };
    case 'completed':
      return {
        borderClass: 'border-border-default',
        bannerBorderClass: null,
        bannerBg: 'bg-status-completed-bg',
        bannerIcon: <Smiley weight="fill" className={STATUS_ICON_CLASS} />,
        bannerLabel: ridesContent.status.completed,
        glowClass: null,
      };
    case 'default':
    default:
      return {
        borderClass: 'border-border-default',
        bannerBorderClass: null,
        bannerBg: null,
        bannerIcon: null,
        bannerLabel: null,
        glowClass: null,
      };
  }
}

/**
 * Resolve the single card state from ride status, signup status, and lifecycle.
 * Priority: cancelled > completed > weather_watch > in_progress > about_to_start > waitlisted > confirmed > default
 */
export function resolveCardState({
  rideStatus,
  signupStatus,
  lifecycle,
}: {
  rideStatus?: string | null;
  signupStatus?: string | null;
  lifecycle?: string | null;
}): CardState {
  // Cancelled is always final
  if (rideStatus === RideStatus.CANCELLED) return 'cancelled';
  // Completed lifecycle beats everything except cancelled — ride is over
  if (lifecycle === 'completed') return 'completed';
  // Weather watch still shows during upcoming/about_to_start/in_progress
  if (rideStatus === RideStatus.WEATHER_WATCH) return 'weather_watch';
  // Lifecycle urgency beats signup status
  if (lifecycle === 'in_progress') return 'in_progress';
  if (lifecycle === 'about_to_start') return 'about_to_start';
  // User's signup status
  if (signupStatus === SignupStatus.WAITLISTED) return 'waitlisted';
  if (signupStatus === SignupStatus.CONFIRMED) return 'confirmed';
  return 'default';
}

// ---------------------------------------------------------------------------
// CardBanner — universal full-width card header banner
// ---------------------------------------------------------------------------

interface CardBannerProps {
  icon: React.ReactNode;
  label: string;
  bgClass: string;
  /** Optional bottom border stroke between banner and content */
  borderClass?: string;
}

/**
 * Universal card status cap. Uses the `status-*` semantic tokens,
 * DM Sans Bold 13/20 label, and fixed dark label text (mode-invariant).
 * Callers provide a pre-rendered icon (Phosphor + weight="fill" or a
 * custom element like PulsatingDot).
 */
export function CardBanner({ icon, label, bgClass, borderClass }: CardBannerProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 overflow-clip px-5 py-2',
        bgClass,
        borderClass && `border-b-(length:--card-border-width) ${borderClass}`,
      )}
    >
      {icon}
      <span className="font-sans text-status-label font-bold text-status-label-text whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

/**
 * Render a CardBanner from a CardStateStyle, if the state has banner config.
 * Accepts an optional label override (e.g. for waitlist position text).
 */
export function StateCardBanner({
  style,
  labelOverride,
  state,
  suppressStates,
}: {
  style: CardStateStyle;
  labelOverride?: string;
  state?: CardState;
  suppressStates?: CardState[];
}) {
  if (state && suppressStates?.includes(state)) return null;
  if (!style.bannerBg || !style.bannerIcon || !style.bannerLabel) return null;
  return (
    <CardBanner
      icon={style.bannerIcon}
      label={labelOverride ?? style.bannerLabel}
      bgClass={style.bannerBg}
      borderClass={style.bannerBorderClass ?? undefined}
    />
  );
}

// ---------------------------------------------------------------------------
// StateCardStripe — left-edge vertical variant of the status accent
// ---------------------------------------------------------------------------

/**
 * Vertical stripe variant of the card status accent for compact cards.
 * Renders the state's background + icon as a full-height left stripe instead
 * of a top banner. Returns null when the state has no banner config.
 */
export function StateCardStripe({
  style,
  labelOverride,
}: {
  style: CardStateStyle;
  labelOverride?: string;
}) {
  if (!style.bannerBg || !style.bannerIcon || !style.bannerLabel) return null;
  return (
    <div
      role="img"
      aria-label={labelOverride ?? style.bannerLabel}
      className={cn(
        'flex w-(--card-status-stripe-width) shrink-0 items-center justify-center self-stretch',
        style.bannerBg,
      )}
    >
      {style.bannerIcon}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StateCardShell — unified card frame for ride + concern cards
//
// Card outline + left status stripe + content slot + optional footer.
// Used by both hero (homepage action bar) and list (rides page) ride cards,
// and the shape future non-ride concern cards (weather alerts,
// announcements, admin nudges) share so they read as siblings of rides.
// ---------------------------------------------------------------------------

interface StateCardShellProps {
  stateStyle: CardStateStyle;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Aria-label override for the stripe (e.g. "Waitlisted · #3"). */
  stripeLabelOverride?: string;
  /** Extra classes merged onto the outer Card. */
  className?: string;
}

export function StateCardShell({
  stateStyle,
  children,
  footer,
  stripeLabelOverride,
  className,
}: StateCardShellProps) {
  return (
    <Card
      className={cn(
        'flex flex-row items-stretch overflow-clip p-0',
        stateStyle.borderClass,
        stateStyle.glowClass,
        className,
      )}
    >
      <StateCardStripe style={stateStyle} labelOverride={stripeLabelOverride} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1">{children}</div>
        {footer && <CardFooterSection>{footer}</CardFooterSection>}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PulsatingDot — live indicator for "Ride in progress" card state
// ---------------------------------------------------------------------------

/**
 * 20×20 container with an 8px brand-magenta dot and a symmetric pulse ring.
 * Ring scales 1× → 2× → 1× while fading in and out; dot breathes in sync.
 * `motion-safe:` gates disable animations under prefers-reduced-motion.
 */
export function PulsatingDot() {
  return (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center" aria-hidden>
      <span className="motion-safe:animate-live-ring absolute size-3 rounded-full bg-status-inProgress-accent" />
      <span className="motion-safe:animate-live-dot relative size-2 rounded-full bg-status-inProgress-accent" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// DateTimeRow — shared date + separator + time row
// ---------------------------------------------------------------------------

interface DateTimeRowProps {
  date: string;
  time: string;
}

export function DateTimeRow({ date, time }: DateTimeRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(OVERLINE, 'text-primary')}>{date}</span>
      <span className={cn(BODY_SM, 'font-bold leading-5 text-(--text-tertiary)')}>
        {separators.dot.trim()}
      </span>
      <span className={cn(OVERLINE, 'text-muted-foreground')}>{time}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetadataStats — stacked label/value columns (Distance, Elevation)
// ---------------------------------------------------------------------------

interface MetadataStatsProps {
  distanceKm: number | null;
  elevationM: number | null;
}

export function MetadataStats({ distanceKm, elevationM }: MetadataStatsProps) {
  const prefs = useUserPrefs();
  const items = [
    distanceKm != null
      ? {
          label: ridesContent.card.distance,
          value: formatDistance(distanceKm, prefs.distance_unit),
        }
      : null,
    elevationM != null
      ? {
          label: ridesContent.card.elevation,
          value: formatElevation(elevationM, prefs.elevation_unit),
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div className="flex items-start gap-4.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-start">
          <span className="font-sans text-overline font-normal leading-5 text-muted-foreground">
            {item.label}
          </span>
          <span className="font-sans text-xs font-bold leading-4.25 text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiderCount — icon + count text (kept for non-card contexts)
// ---------------------------------------------------------------------------

interface RiderCountProps {
  signupCount: number;
  capacity: number | null;
}

export function RiderCount({ signupCount, capacity }: RiderCountProps) {
  const spotsText = capacity != null ? `${signupCount}/${capacity}` : `${signupCount}`;

  return (
    <div className="flex items-center gap-2">
      <Users className="size-4 text-muted-foreground" />
      <span className={cn(CAPTION_SM, 'font-normal leading-3.5 text-muted-foreground')}>
        {spotsText}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiderAvatarGroup — avatar stack with overflow count + total
// ---------------------------------------------------------------------------

const MAX_VISIBLE_AVATARS = 4;

interface RiderAvatarGroupProps {
  avatars: SignupAvatar[];
  totalCount: number;
  /** When true, avatars render in grayscale (e.g. cancelled rides) */
  cancelled?: boolean;
  /** CSS value for the ring colour between overlapping avatars. */
  surface?: string;
  /** Override the default number of visible avatars before "+N" overflow. */
  maxVisible?: number;
}

export function RiderAvatarGroup({
  avatars,
  totalCount,
  cancelled,
  surface,
  maxVisible = MAX_VISIBLE_AVATARS,
}: RiderAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const overflowCount = totalCount - visibleAvatars.length;
  const countNumber = `${totalCount}`;

  return (
    <div className="flex items-center gap-3">
      {visibleAvatars.length > 0 && (
        <RiderAvatarStack surface={surface} className={cn(cancelled && 'grayscale')}>
          {visibleAvatars.map((person, i) => (
            <RiderAvatar key={i} avatarUrl={person.avatar_url} name={person.full_name} />
          ))}
          {overflowCount > 0 && <RiderAvatarOverflow count={overflowCount} />}
        </RiderAvatarStack>
      )}
      <span className={cn(BODY_SM, 'min-w-0 truncate font-medium text-foreground')}>
        {countNumber} {ridesContent.card.riding}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LeaderRow — creator + co-leader avatars above rider group
// ---------------------------------------------------------------------------

interface LeaderRowProps {
  creator: { full_name: string; avatar_url: string | null } | null;
  coLeaders: { full_name: string; avatar_url: string | null }[];
}

export function LeaderRow({ creator, coLeaders }: LeaderRowProps) {
  if (!creator) return null;
  const allLeaders = [creator, ...coLeaders];

  return (
    <div className="flex items-center gap-2">
      <span className={cn(BODY_SM, 'text-muted-foreground shrink-0')}>
        {ridesContent.card.ledBy}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        {allLeaders.map((leader, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <RiderAvatar avatarUrl={leader.avatar_url} name={leader.full_name} className="size-6" />
            <span className={cn(BODY_SM, 'font-medium text-foreground truncate')}>
              {leader.full_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardMetadataRow — inline data values with icons
// ---------------------------------------------------------------------------

interface CardMetadataRowProps {
  distanceKm?: number | null;
  elevationM?: number | null;
  durationDisplay?: string | null;
  locationName?: string | null;
  className?: string;
}

export function CardMetadataRow({
  distanceKm,
  elevationM,
  durationDisplay,
  locationName,
  className,
}: CardMetadataRowProps) {
  const prefs = useUserPrefs();
  const hasAny = distanceKm != null || elevationM != null || durationDisplay || locationName;
  if (!hasAny) return null;

  // Consistent order: distance, elevation, duration, location
  const dataItems: React.ReactNode[] = [];

  if (distanceKm != null) {
    dataItems.push(
      <span key="dist" className="flex shrink-0 items-center gap-1">
        <Path className="size-3.5 shrink-0" />
        {formatDistance(distanceKm, prefs.distance_unit)}
      </span>,
    );
  }
  if (elevationM != null) {
    dataItems.push(
      <span key="elev" className="flex shrink-0 items-center gap-1">
        <Mountains className="size-3.5 shrink-0" />
        {formatElevation(elevationM, prefs.elevation_unit)}
      </span>,
    );
  }
  if (durationDisplay) {
    dataItems.push(
      <span key="dur" className="flex shrink-0 items-center gap-1">
        <Clock className="size-3.5 shrink-0" />
        {durationDisplay}
      </span>,
    );
  }
  if (locationName) {
    dataItems.push(
      <span key="loc" className="flex min-w-0 items-center gap-1">
        <MapPin className="size-3.5 shrink-0" />
        <span className="truncate">{locationName}</span>
      </span>,
    );
  }

  if (dataItems.length === 0) return null;

  return (
    <div
      className={cn(
        DATA_SM,
        'flex min-w-0 items-center gap-4 overflow-hidden text-muted-foreground',
        className,
      )}
    >
      {dataItems.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center last:shrink last:overflow-hidden">
          {i > 0 && (
            <span className="mr-2 hidden text-border-default sm:inline">
              {separators.dot.trim()}
            </span>
          )}
          {item}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardContentSection — unified content layout for all card types
//
// Top row:    [DateTimeRow · WeatherBadge (left)] ... [Recurring icon (right)]
// Title
// Description (line-clamped)
// Pace Badge (left-aligned)
// CardMetadataRow (full-width, stackable)
// ---------------------------------------------------------------------------

interface CardContentSectionProps {
  date: string;
  time: string;
  title: string;
  description?: string | null;
  paceGroupName?: string | null;
  paceGroupSortOrder?: number | null;
  distanceKm?: number | null;
  elevationM?: number | null;
  durationDisplay?: string | null;
  locationName?: string | null;
  weather?: RideWeatherSnapshot | null;
  /**
   * Small uppercase concern-type label at the top of the card
   * (e.g. "Your Next Ride", "Next Club Ride"). Hero variant only.
   * §8 capline: Option A — revisit placement after visual review
   */
  capline?: string;
  /** Extra content between description and metadata (e.g. waitlist position) */
  children?: React.ReactNode;
  className?: string;
}

export function CardContentSection({
  date,
  time,
  title,
  description,
  paceGroupName,
  paceGroupSortOrder,
  distanceKm,
  elevationM,
  durationDisplay,
  locationName,
  weather,
  capline,
  children,
  className,
}: CardContentSectionProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {capline && <span className={cn(OVERLINE, 'text-muted-foreground')}>{capline}</span>}

      {/* Top row: date/time · weather */}
      <div className="flex items-center gap-1.5">
        <DateTimeRow date={date} time={time} />
        <span className={cn(BODY_SM, 'font-bold leading-5 text-(--text-tertiary)')}>
          {separators.dot.trim()}
        </span>
        <RideWeatherBadge weather={weather ?? null} layout="inline" />
      </div>

      {/* Title */}
      <h3 className="truncate font-display text-xl font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}

      {children}

      {/* Bottom row: metadata (left) + pace badge (right), stacks at small widths */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <CardMetadataRow
          distanceKm={distanceKm}
          elevationM={elevationM}
          durationDisplay={durationDisplay}
          locationName={locationName}
        />
        {paceGroupName && (
          <Badge
            variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
            className="self-start sm:self-auto"
          >
            {paceGroupName}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardFooterSection — visually distinct footer area for Rides/Schedule cards
// No top border — the stroke is between the banner and content instead.
// ---------------------------------------------------------------------------

interface CardFooterSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooterSection({ children, className }: CardFooterSectionProps) {
  return <div className={cn('bg-surface-card-footer-soft px-5 py-3.5', className)}>{children}</div>;
}
