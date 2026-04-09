import {
  Bicycle,
  Clock,
  ClockCountdown,
  CloudWarning,
  Hourglass,
  MapPin,
  Mountains,
  Path,
  Prohibit,
  SealCheck,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { separators, units, getPaceBadgeVariant } from '@/config/formatting';
import { RideStatus, SignupStatus } from '@/config/statuses';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { RideWeatherSnapshot, SignupAvatar } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Shared styles — design system token classes
// ---------------------------------------------------------------------------

/** overline token: 11→12 px fluid, semibold, uppercase, tracked */
export const OVERLINE = 'font-sans text-overline font-semibold uppercase tracking-[0.06em]';

/** body/sm token: 13→14 px fluid, regular weight */
export const BODY_SM = 'font-sans text-body-sm';

/** label/sm token: same size as overline, without uppercase */
export const LABEL_SM = 'font-sans text-overline';

/** caption/sm token: 10→11 px fluid, mono for small data labels */
export const CAPTION_SM = 'font-mono text-caption-sm';

/** data/sm token: 12→13 px fluid, mono, regular weight */
export const DATA_SM = 'font-mono text-xs';

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

interface CardStateStyle {
  /** Muted status border for the card outline (300 light / 700 dark) */
  borderClass: string;
  /** Status-coloured stroke between banner and content (matches banner text) */
  bannerBorderClass: string | null;
  bannerBg: string | null;
  bannerText: string | null;
  bannerIcon: PhosphorIcon | null;
  bannerLabel: string | null;
}

export function getCardStateStyle(state: CardState): CardStateStyle {
  switch (state) {
    case 'confirmed':
      return {
        borderClass: 'border-card-border-success',
        bannerBorderClass: 'border-card-border-success',
        bannerBg: 'bg-banner-soft-success-bg',
        bannerText: 'text-banner-soft-success-text',
        bannerIcon: SealCheck,
        bannerLabel: ridesContent.card.signedUp,
      };
    case 'waitlisted':
      return {
        borderClass: 'border-card-border-warning',
        bannerBorderClass: 'border-card-border-warning',
        bannerBg: 'bg-banner-soft-warning-bg',
        bannerText: 'text-banner-soft-warning-text',
        bannerIcon: Hourglass,
        bannerLabel: ridesContent.card.waitlisted,
      };
    case 'weather_watch':
      return {
        borderClass: 'border-card-border-warning',
        bannerBorderClass: 'border-card-border-warning',
        bannerBg: 'bg-banner-soft-warning-bg',
        bannerText: 'text-banner-soft-warning-text',
        bannerIcon: CloudWarning,
        bannerLabel: ridesContent.status.weatherWatch,
      };
    case 'cancelled':
      return {
        borderClass: 'border-card-border-error',
        bannerBorderClass: 'border-card-border-error',
        bannerBg: 'bg-banner-soft-error-bg',
        bannerText: 'text-banner-soft-error-text',
        bannerIcon: Prohibit,
        bannerLabel: ridesContent.status.cancelled,
      };
    case 'in_progress':
      return {
        borderClass: 'border-card-border-info',
        bannerBorderClass: 'border-card-border-info',
        bannerBg: 'bg-banner-soft-info-bg',
        bannerText: 'text-banner-soft-info-text',
        bannerIcon: Bicycle,
        bannerLabel: ridesContent.status.inProgress,
      };
    case 'about_to_start':
      return {
        borderClass: 'border-card-border-info',
        bannerBorderClass: 'border-card-border-info',
        bannerBg: 'bg-banner-soft-info-bg',
        bannerText: 'text-banner-soft-info-text',
        bannerIcon: ClockCountdown,
        bannerLabel: ridesContent.status.aboutToStart,
      };
    case 'completed':
      return {
        borderClass: 'border-border-default',
        bannerBorderClass: 'border-border-default',
        bannerBg: 'bg-banner-muted-bg',
        bannerText: 'text-banner-muted-text',
        bannerIcon: SealCheck,
        bannerLabel: ridesContent.status.completed,
      };
    case 'default':
    default:
      return {
        borderClass: 'border-border-default',
        bannerBorderClass: null,
        bannerBg: null,
        bannerText: null,
        bannerIcon: null,
        bannerLabel: null,
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
  icon: PhosphorIcon;
  label: string;
  bgClass: string;
  textClass: string;
  /** Status-coloured bottom border (stroke between banner and content) */
  borderClass?: string;
}

export function CardBanner({
  icon: Icon,
  label,
  bgClass,
  textClass,
  borderClass,
}: CardBannerProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 overflow-clip px-5 py-2',
        bgClass,
        borderClass && `border-b-(length:--card-border-width) ${borderClass}`,
      )}
    >
      <Icon weight="bold" className={cn('size-3.5 shrink-0', textClass)} />
      <span
        className={cn(
          'font-sans text-xs font-semibold uppercase tracking-[0.06em] leading-4.25 whitespace-nowrap',
          textClass,
        )}
      >
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
  if (!style.bannerBg || !style.bannerText || !style.bannerIcon || !style.bannerLabel) return null;
  return (
    <CardBanner
      icon={style.bannerIcon}
      label={labelOverride ?? style.bannerLabel}
      bgClass={style.bannerBg}
      textClass={style.bannerText}
      borderClass={style.bannerBorderClass ?? undefined}
    />
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
      <span className={cn(BODY_SM, 'font-bold leading-5 text-muted-foreground/40')}>
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
  const items = [
    distanceKm != null
      ? { label: ridesContent.card.distance, value: `${distanceKm}${units.km}` }
      : null,
    elevationM != null
      ? { label: ridesContent.card.elevation, value: `${elevationM}${units.m}` }
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
          <span className="font-mono text-xs font-bold leading-4.25 text-foreground">
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
  const hasAny = distanceKm != null || elevationM != null || durationDisplay || locationName;
  if (!hasAny) return null;

  // Consistent order: distance, elevation, duration, location
  const dataItems: React.ReactNode[] = [];

  if (distanceKm != null) {
    dataItems.push(
      <span key="dist" className="flex shrink-0 items-center gap-1">
        <Path className="size-3.5 shrink-0" />
        {distanceKm}
        {units.km}
      </span>,
    );
  }
  if (elevationM != null) {
    dataItems.push(
      <span key="elev" className="flex shrink-0 items-center gap-1">
        <Mountains className="size-3.5 shrink-0" />
        {elevationM}
        {units.m}
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
  children,
  className,
}: CardContentSectionProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Top row: date/time · weather */}
      <div className="flex items-center gap-1.5">
        <DateTimeRow date={date} time={time} />
        <span className={cn(BODY_SM, 'font-bold leading-5 text-muted-foreground/40')}>
          {separators.dot.trim()}
        </span>
        <RideWeatherBadge weather={weather ?? null} layout="inline" />
      </div>

      {/* Title */}
      <h3 className="truncate font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
        {title}
      </h3>

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
  return (
    <div
      className={cn(
        'bg-[color-mix(in_oklab,var(--surface-card-footer)_40%,transparent)] px-5 py-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
