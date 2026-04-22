'use client';

import { Heart, MapPin } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { PolylineSvg } from '../polyline-svg';
import { mockRides, type MockRide } from '../mock-data';
import { DirectionShell } from './direction-shell';

function tintClass(ride: MockRide): string {
  switch (ride.paceSortOrder) {
    case 1:
    case 2:
      return 'from-badge-pace-1-bg to-badge-pace-2-bg';
    case 3:
      return 'from-badge-pace-3-bg to-badge-pace-4-bg';
    case 4:
      return 'from-badge-pace-4-bg to-badge-pace-5-bg';
    case 5:
    case 6:
    default:
      return 'from-badge-pace-5-bg to-badge-pace-6-bg';
  }
}

function statePillClass(state: MockRide['state']): string {
  switch (state) {
    case 'confirmed':
      return 'bg-status-confirmed-bg';
    case 'waitlisted':
      return 'bg-status-waitlisted-bg';
    case 'weather_watch':
      return 'bg-status-weatherWatch-bg';
    case 'cancelled':
      return 'bg-status-cancelled-bg';
    default:
      return 'bg-card';
  }
}

function stateText(ride: MockRide): string {
  if (ride.state === 'confirmed') return "You're in";
  if (ride.state === 'waitlisted') return `Waitlist · #${ride.waitlistPosition}`;
  if (ride.state === 'weather_watch') return 'Weather watch';
  if (ride.state === 'cancelled') return 'Cancelled';
  return 'Open';
}

function MapTile({ ride, heightClass }: { ride: MockRide; heightClass: string }) {
  return (
    <div
      className={cn(
        'relative overflow-clip bg-gradient-to-br text-primary',
        heightClass,
        tintClass(ride),
      )}
    >
      <PolylineSvg
        coords={ride.routeShape}
        className="absolute inset-0 h-full w-full text-foreground/85"
        strokeWidth={1.6}
        padding={10}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] opacity-70" />
    </div>
  );
}

function ListCard({ ride }: { ride: MockRide }) {
  return (
    <article className="overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      <div className="relative">
        <MapTile ride={ride} heightClass="h-36" />
        <span
          className={cn(
            'absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-sm',
            statePillClass(ride.state),
          )}
        >
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-foreground">
            {stateText(ride)}
          </span>
        </span>
        <button
          type="button"
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition hover:text-primary"
          aria-label="Save for later"
        >
          <Heart weight="regular" className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-sans text-base font-semibold leading-tight text-foreground">
            {ride.title}
          </h3>
          <span className="shrink-0 font-sans text-sm font-semibold text-foreground tabular-nums">
            {ride.distanceKm} km
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="font-sans text-xs text-muted-foreground">
            {ride.startTime} · {ride.startLocation}
          </span>
        </div>
      </div>
    </article>
  );
}

function HomeHero({ ride }: { ride: MockRide }) {
  return (
    <article className="overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      <div className="relative">
        <MapTile ride={ride} heightClass="h-56" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span
          className={cn(
            'absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm',
            statePillClass(ride.state),
          )}
        >
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-foreground">
            {stateText(ride)}
          </span>
        </span>
        <button
          type="button"
          className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition hover:text-primary"
          aria-label="Save for later"
        >
          <Heart weight="regular" className="size-4" />
        </button>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-5 pb-4 text-white mix-blend-plus-lighter">
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.08em] text-white/85">
            {ride.dayLabel} · {ride.startTime}
          </span>
          <h2 className="font-sans text-2xl font-bold leading-tight text-white drop-shadow-sm">
            {ride.title}
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground">
            <MapPin weight="duotone" className="size-3.5" />
            {ride.startLocation}
          </span>
        </div>
        <span className="font-sans text-sm font-semibold text-foreground tabular-nums">
          {ride.distanceKm} km
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            · {ride.elevationM} m ↑
          </span>
        </span>
      </div>
    </article>
  );
}

export function AirbnbLiteralDirection() {
  return (
    <DirectionShell
      label="04"
      name="Airbnb-literal"
      thesis="Treat each ride like a listing. Top half imagery, bottom half metadata."
      borrows={['Hero imagery', 'Favorite affordance', 'Gradient-masked metadata']}
      rejects={['Text-dense compactness']}
      tradeoff="Beautiful but heavy. Tension with Draftr's non-marketplace identity — the heart icon risks implying a save-for-later pattern the product doesn't actually support. Also introduces an imagery pipeline the app doesn't have; the gradient tiles here stand in for real map tiles or neighborhood photos."
      tone="muted"
    >
      <HomeHero ride={mockRides.humberConfirmed} />
      <div className="space-y-3">
        <ListCard ride={mockRides.frenchmansWaitlist} />
        <ListCard ride={mockRides.scarboroughOpen} />
        <ListCard ride={mockRides.burlingtonWeather} />
      </div>
    </DirectionShell>
  );
}
