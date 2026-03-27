import {
  ArrowsClockwise,
  Clock,
  MapPin,
  Mountains,
  Path,
  Users,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { RideWeatherBadge } from '@/components/weather/ride-weather-badge';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { separators, units, getPaceBadgeVariant } from '@/config/formatting';
import { RideStatus } from '@/config/statuses';
import type { RideWeatherSnapshot } from '@/types/database';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// Shared styles — design system token classes
// ---------------------------------------------------------------------------

/** overline token: 11px, semibold, uppercase, tracked */
export const OVERLINE = 'font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em]';

/** body/sm token: 13px, regular weight */
export const BODY_SM = 'font-sans text-[0.8125rem]';

/** label/sm token: 11px sans for small labels (same size as overline, without uppercase) */
export const LABEL_SM = 'font-sans text-[0.6875rem]';

/** caption/sm token: 10px mono for small data labels */
export const CAPTION_SM = 'font-mono text-[0.625rem]';

// ---------------------------------------------------------------------------
// CardBanner — universal full-width card header banner
// ---------------------------------------------------------------------------

interface CardBannerProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgClass: string;
  textClass: string;
}

export function CardBanner({ icon: Icon, label, bgClass, textClass }: CardBannerProps) {
  return (
    <div className={cn('flex w-full items-center gap-2 overflow-clip px-5 py-2', bgClass)}>
      <Icon className={cn('size-3.5 shrink-0', textClass)} />
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

// ---------------------------------------------------------------------------
// RideBanner — convenience wrapper for ride status banners
// ---------------------------------------------------------------------------

interface RideBannerProps {
  type: typeof RideStatus.WEATHER_WATCH | typeof RideStatus.CANCELLED;
}

export function RideBanner({ type }: RideBannerProps) {
  const isWarning = type === RideStatus.WEATHER_WATCH;

  return (
    <CardBanner
      icon={isWarning ? WarningCircle : XCircle}
      label={isWarning ? ridesContent.status.weatherWatch : ridesContent.status.cancelled}
      bgClass={isWarning ? 'bg-banner-warning-bg' : 'bg-banner-error-bg'}
      textClass={isWarning ? 'text-banner-warning-text' : 'text-banner-error-text'}
    />
  );
}

// ---------------------------------------------------------------------------
// DateTimeRow — shared date + separator + time row
// ---------------------------------------------------------------------------

interface DateTimeRowProps {
  date: string;
  time: string;
  isRecurring?: boolean;
}

export function DateTimeRow({ date, time, isRecurring }: DateTimeRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(OVERLINE, 'text-primary')}>{date}</span>
      <span className={cn(BODY_SM, 'font-bold leading-5 text-muted-foreground/40')}>
        {separators.dot.trim()}
      </span>
      <span className={cn(OVERLINE, 'text-muted-foreground')}>{time}</span>
      {isRecurring && <ArrowsClockwise className="h-3.5 w-3.5 text-muted-foreground/50" />}
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
          <span className="font-sans text-[0.6875rem] font-normal leading-5 text-muted-foreground">
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
// RiderCount — icon + count text
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
// CardMetadataRow — inline data values with icons
//
// Uses data/sm token (12px JB Mono 400) for all data values.
// ---------------------------------------------------------------------------

/** data/sm token: 12px mono, regular weight */
export const DATA_SM = 'font-mono text-xs';

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
        'grid min-w-0 grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-muted-foreground',
        'sm:flex sm:items-center sm:gap-3',
        className,
      )}
    >
      {dataItems.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && (
            <span className="mr-3 hidden text-border-default sm:inline">
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
// CardContentSection — shared four-corner content layout for all card types
//
// Top row:    DateTimeRow (left) + Pace Badge (right)
// Middle:     Title + optional description + optional children
// Bottom row: CardMetadataRow (left) + RideWeatherBadge (right)
// ---------------------------------------------------------------------------

interface CardContentSectionProps {
  date: string;
  time: string;
  isRecurring?: boolean;
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
  isRecurring,
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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <DateTimeRow date={date} time={time} isRecurring={isRecurring} />
          {paceGroupName && (
            <Badge
              variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
            >
              {paceGroupName}
            </Badge>
          )}
        </div>
        <h3 className="truncate font-display text-xl font-semibold tracking-[-0.015em] text-foreground">
          {title}
        </h3>
      </div>

      {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}

      {children}

      <div className="flex flex-wrap items-end justify-between gap-y-2">
        <CardMetadataRow
          distanceKm={distanceKm}
          elevationM={elevationM}
          durationDisplay={durationDisplay}
          locationName={locationName}
        />
        <RideWeatherBadge weather={weather ?? null} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardFooterSection — visually distinct footer area for Rides/Schedule cards
// ---------------------------------------------------------------------------

interface CardFooterSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooterSection({ children, className }: CardFooterSectionProps) {
  return <div className={cn('bg-surface-page px-5 py-3', className)}>{children}</div>;
}
