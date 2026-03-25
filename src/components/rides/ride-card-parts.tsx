import { ArrowsClockwise, Users, WarningCircle, XCircle } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { separators, units, getPaceBadgeVariant } from '@/config/formatting';
import { RideStatus } from '@/config/statuses';

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
    <div className={cn('flex w-full items-center gap-2 overflow-clip px-6 py-2', bgClass)}>
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
      bgClass={isWarning ? 'bg-feedback-warning-bg' : 'bg-feedback-error-bg'}
      textClass={isWarning ? 'text-feedback-warning-text' : 'text-feedback-error-text'}
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
// CapacityBarLarge — 4px track + fill + rider count
// ---------------------------------------------------------------------------

interface CapacityBarLargeProps {
  signupCount: number;
  capacity: number | null;
}

export function CapacityBarLarge({ signupCount, capacity }: CapacityBarLargeProps) {
  if (capacity == null) return null;

  const percent = Math.min((signupCount / capacity) * 100, 100);

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex flex-1 overflow-clip rounded-full">
        <div className="h-1 w-full bg-muted" />
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
      <RiderCount signupCount={signupCount} capacity={capacity} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlineMetadata — Home card: pace badge + distance + location in one row
// ---------------------------------------------------------------------------

interface InlineMetadataProps {
  paceGroupName: string | null;
  paceGroupSortOrder: number | null;
  distanceKm: number | null;
  locationName: string | null;
}

export function InlineMetadata({
  paceGroupName,
  paceGroupSortOrder,
  distanceKm,
  locationName,
}: InlineMetadataProps) {
  const hasAny = paceGroupName || distanceKm != null || locationName;
  if (!hasAny) return null;

  return (
    <div className="flex items-center gap-4">
      {paceGroupName && (
        <Badge
          variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
          size="sm"
        >
          {paceGroupName}
        </Badge>
      )}
      {distanceKm != null && (
        <span className={cn(BODY_SM, 'text-muted-foreground')}>
          {distanceKm}
          {units.km}
        </span>
      )}
      {locationName && <span className={cn(BODY_SM, 'text-muted-foreground')}>{locationName}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScheduleStats — Schedule card: pace badge + distance/elevation/duration
// ---------------------------------------------------------------------------

interface ScheduleStatsProps {
  paceGroupName: string | null;
  paceGroupSortOrder: number | null;
  distanceKm: number | null;
  elevationM: number | null;
  durationDisplay: string | null;
}

export function ScheduleStats({
  paceGroupName,
  paceGroupSortOrder,
  distanceKm,
  elevationM,
  durationDisplay,
}: ScheduleStatsProps) {
  const hasStats = paceGroupName || distanceKm != null || elevationM != null || durationDisplay;
  if (!hasStats) return null;

  return (
    <div className="flex items-center gap-4.5">
      {paceGroupName && (
        <Badge
          variant={paceGroupSortOrder ? getPaceBadgeVariant(paceGroupSortOrder) : 'secondary'}
          size="sm"
        >
          {paceGroupName}
        </Badge>
      )}
      {distanceKm != null && (
        <span className="font-mono text-xs font-bold leading-4.25 text-foreground">
          {distanceKm}
          {units.km}
        </span>
      )}
      {elevationM != null && (
        <span className="font-mono text-xs font-bold leading-4.25 text-foreground">
          {elevationM}
          {units.m}
        </span>
      )}
      {durationDisplay && (
        <span className="font-mono text-xs font-bold leading-4.25 text-foreground">
          {durationDisplay}
        </span>
      )}
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
  return <div className={cn('bg-surface-page px-6 py-3', className)}>{children}</div>;
}
