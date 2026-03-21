import {
  MapPin,
  Path,
  Users,
  Mountains,
  Clock,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import { units } from '@/config/formatting';

const { rides: ridesContent } = appContent;

// ---------------------------------------------------------------------------
// RideBanner
// ---------------------------------------------------------------------------

interface RideBannerProps {
  type: 'weather_watch' | 'cancelled';
}

export function RideBanner({ type }: RideBannerProps) {
  const isWarning = type === 'weather_watch';

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 overflow-clip px-6 py-2',
        isWarning ? 'bg-feedback-warning-bg' : 'bg-feedback-error-bg',
      )}
    >
      {isWarning ? (
        <WarningCircle className="size-3.5 shrink-0 text-feedback-warning-text" />
      ) : (
        <XCircle className="size-3.5 shrink-0 text-feedback-error-text" />
      )}
      <span
        className={cn(
          'font-sans text-xs font-medium leading-[17px] tracking-[0.012px] whitespace-nowrap',
          isWarning ? 'text-feedback-warning-text' : 'text-feedback-error-text',
        )}
      >
        {isWarning ? ridesContent.status.weatherWatch : ridesContent.status.cancelled}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetadataStatsLarge — stacked value + label columns
// ---------------------------------------------------------------------------

interface MetadataStatsLargeProps {
  distanceKm: number | null;
  elevationM: number | null;
  estimatedMinutes: number | null;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function MetadataStatsLarge({
  distanceKm,
  elevationM,
  estimatedMinutes,
}: MetadataStatsLargeProps) {
  const items = [
    distanceKm != null
      ? { value: `${distanceKm}${units.km}`, label: ridesContent.card.distance }
      : null,
    elevationM != null
      ? { value: `${elevationM}${units.m}`, label: ridesContent.card.elevation }
      : null,
    estimatedMinutes != null
      ? { value: formatDuration(estimatedMinutes), label: ridesContent.card.time }
      : null,
  ].filter(Boolean) as { value: string; label: string }[];

  if (items.length === 0) return null;

  return (
    <div className="flex items-start gap-6">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-start">
          <span className="font-mono text-base font-medium leading-[21px] tracking-[-0.16px] text-text-primary">
            {item.value}
          </span>
          <span className="font-mono text-xs font-normal leading-[17px] text-text-secondary">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetadataStatsMedium — inline row with icons
// ---------------------------------------------------------------------------

interface MetadataStatsMediumProps {
  distanceKm: number | null;
  elevationM: number | null;
  estimatedMinutes: number | null;
}

export function MetadataStatsMedium({
  distanceKm,
  elevationM,
  estimatedMinutes,
}: MetadataStatsMediumProps) {
  const items = [
    distanceKm != null ? { icon: Path, value: `${distanceKm}${units.km}` } : null,
    elevationM != null ? { icon: Mountains, value: `${elevationM}${units.m}` } : null,
    estimatedMinutes != null ? { icon: Clock, value: formatDuration(estimatedMinutes) } : null,
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; value: string }[];

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <div key={item.value} className="flex items-center gap-1">
          <item.icon className="size-[11px] text-text-primary" />
          <span className="font-mono text-[10px] font-normal leading-[14px] text-text-primary">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VibeTags — row of small tags with overflow "+N"
// ---------------------------------------------------------------------------

interface VibeTagsProps {
  tags: { id: string; name: string }[];
  maxVisible?: number;
}

export function VibeTags({ tags, maxVisible = 3 }: VibeTagsProps) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, maxVisible);
  const overflowCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap items-start gap-1.5">
      {visible.map((tag) => (
        <Badge
          key={tag.id}
          variant="vibe"
          shape="subtle"
          size="sm"
          className="px-1.5 py-1 text-[10px] leading-[14px] tracking-[0.2px]"
        >
          {tag.name}
        </Badge>
      ))}
      {overflowCount > 0 && (
        <Badge
          variant="vibe"
          shape="subtle"
          size="sm"
          className="px-1.5 py-1 text-[10px] leading-[14px] tracking-[0.2px]"
        >
          +{overflowCount}
        </Badge>
      )}
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
  const spotsText = `${signupCount}/${capacity}`;

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex flex-1 overflow-clip rounded-full">
        <div className="h-1 w-full bg-accent-primary-subtle" />
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-accent-primary-default"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Users className="size-4 text-text-tertiary" />
        <span className="font-mono text-[10px] font-normal leading-[14px] text-text-tertiary">
          {spotsText}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiderCount — standalone icon + count for medium card
// ---------------------------------------------------------------------------

interface RiderCountProps {
  signupCount: number;
  capacity: number | null;
}

export function RiderCount({ signupCount, capacity }: RiderCountProps) {
  const spotsText = capacity != null ? `${signupCount}/${capacity}` : `${signupCount}`;

  return (
    <div className="flex items-center gap-2">
      <Users className="size-4 text-text-tertiary" />
      <span className="font-mono text-[10px] font-normal leading-[14px] text-text-tertiary">
        {spotsText}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LocationRow — MapPin icon + location name
// ---------------------------------------------------------------------------

interface LocationRowProps {
  name: string;
}

export function LocationRow({ name }: LocationRowProps) {
  return (
    <div className="flex items-center gap-1">
      <MapPin className="size-4 shrink-0 text-text-secondary" />
      <span className="font-sans text-[13px] font-normal leading-5 text-text-secondary">
        {name}
      </span>
    </div>
  );
}
