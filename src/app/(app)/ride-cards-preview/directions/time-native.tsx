'use client';

import { MapPin } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { mockRides, type MockRide } from '../mock-data';
import { DirectionShell } from './direction-shell';

function stateRailClass(state: MockRide['state']): string {
  switch (state) {
    case 'confirmed':
      return 'bg-status-confirmed-bg text-foreground';
    case 'waitlisted':
      return 'bg-status-waitlisted-bg text-foreground';
    case 'weather_watch':
      return 'bg-status-weatherWatch-bg text-foreground';
    case 'cancelled':
      return 'bg-status-cancelled-bg text-foreground';
    default:
      return 'bg-surface-raised text-foreground';
  }
}

function stateCaption(ride: MockRide): string {
  if (ride.state === 'confirmed') return "You're in";
  if (ride.state === 'waitlisted') return `Wait · #${ride.waitlistPosition}`;
  if (ride.state === 'weather_watch') return 'Watch';
  if (ride.state === 'cancelled') return 'Off';
  return 'Open';
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function ListCard({ ride }: { ride: MockRide }) {
  const [hour, meridiem] = ride.startTime.split(' ');
  return (
    <article className="flex items-stretch overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      <div
        className={cn(
          'flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-3',
          stateRailClass(ride.state),
        )}
      >
        <span className="font-sans text-base font-bold leading-none text-foreground tabular-nums">
          {hour}
        </span>
        <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {meridiem}
        </span>
        <span className="mt-1 font-sans text-overline font-normal text-muted-foreground">
          {formatDuration(ride.durationMin)}
        </span>
        <span className="mt-1 font-sans text-overline font-semibold uppercase tracking-[0.06em] text-foreground">
          {stateCaption(ride)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
        <h3 className="truncate font-sans text-base font-semibold leading-tight text-foreground">
          {ride.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="font-sans text-xs font-medium text-foreground tabular-nums">
            {ride.distanceKm} km
          </span>
        </div>
        <p className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground">
          <MapPin weight="duotone" className="size-3.5" />
          {ride.startLocation}
        </p>
      </div>
    </article>
  );
}

function HomeHero({ ride }: { ride: MockRide }) {
  return (
    <article className="overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-5 py-3',
          stateRailClass(ride.state),
        )}
      >
        <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-foreground">
          {stateCaption(ride)}
        </span>
        <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {ride.dayLabel}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-4xl font-bold leading-none text-foreground tabular-nums">
            {ride.startTime.split(' ')[0]}
          </span>
          <span className="font-sans text-lg font-semibold text-muted-foreground">
            {ride.startTime.split(' ')[1]}
          </span>
          <span className="ml-auto font-sans text-xs text-muted-foreground">
            {formatDuration(ride.durationMin)} · ends ~
            {(() => {
              const [h, m] = ride.startTime.split(' ')[0].split(':').map(Number);
              const totalMin = h * 60 + m + ride.durationMin;
              const endH = Math.floor(totalMin / 60) % 12 || 12;
              const endM = totalMin % 60;
              return `${endH}:${endM.toString().padStart(2, '0')}`;
            })()}
          </span>
        </div>
        <h2 className="font-sans text-xl font-bold leading-tight text-foreground">{ride.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground">
            <MapPin weight="duotone" className="size-3.5" />
            {ride.startLocation}
          </span>
          <span className="font-sans text-xs font-medium text-foreground tabular-nums">
            · {ride.distanceKm} km
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <RiderAvatarStack surface="var(--surface-card)">
            {ride.avatars.slice(0, 4).map((a, i) => (
              <RiderAvatar key={i} avatarUrl={a.avatar_url} name={a.full_name} />
            ))}
            {ride.signupCount > 4 && <RiderAvatarOverflow count={ride.signupCount - 4} />}
          </RiderAvatarStack>
          <span className="font-sans text-xs text-muted-foreground">{ride.signupCount} riding</span>
        </div>
      </div>
    </article>
  );
}

export function TimeNativeDirection() {
  return (
    <DirectionShell
      label="03"
      name="Time-native"
      thesis="Rides are time blocks first. The agenda should feel like a calendar, not a feed."
      borrows={['Progressive disclosure (detail on tap)']}
      rejects={['Hero imagery', 'Social prominence', 'Most Airbnb patterns']}
      tradeoff="Scannable and calm for riders who browse by day. Riders who sort by distance or level take an extra beat to scan the body column."
    >
      <HomeHero ride={mockRides.humberConfirmed} />
      <div className="space-y-2.5">
        <ListCard ride={mockRides.humberConfirmed} />
        <ListCard ride={mockRides.frenchmansWaitlist} />
        <ListCard ride={mockRides.burlingtonWeather} />
      </div>
    </DirectionShell>
  );
}
