'use client';

import { MapPin, Clock } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { PolylineSvg, ElevationSvg } from '../polyline-svg';
import { mockRides, type MockRide } from '../mock-data';
import { DirectionShell } from './direction-shell';

function stateRingClass(state: MockRide['state']): string {
  switch (state) {
    case 'confirmed':
      return 'ring-card-border-success';
    case 'waitlisted':
      return 'ring-card-border-warning';
    case 'weather_watch':
      return 'ring-card-border-warning';
    case 'cancelled':
      return 'ring-card-border-error';
    default:
      return 'ring-border-default';
  }
}

function stateDotBg(state: MockRide['state']): string {
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
      return 'bg-surface-raised';
  }
}

function StateLabel({ state }: { state: MockRide['state'] }) {
  const label =
    state === 'confirmed'
      ? "You're in"
      : state === 'waitlisted'
        ? 'Waitlisted'
        : state === 'weather_watch'
          ? 'Weather watch'
          : state === 'cancelled'
            ? 'Cancelled'
            : 'Open — join';
  return (
    <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {label}
    </span>
  );
}

function ListCard({ ride }: { ride: MockRide }) {
  return (
    <article className="flex items-stretch gap-4 rounded-(--card-radius) bg-card p-3 shadow-(--card-shadow)">
      <div
        className={cn(
          'relative flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-raised ring-2 ring-offset-0',
          stateRingClass(ride.state),
        )}
      >
        <PolylineSvg coords={ride.routeShape} className="h-14 w-14 text-primary" strokeWidth={3} />
        <span
          className={cn(
            'absolute -top-1 -right-1 size-3 rounded-full ring-2 ring-card',
            stateDotBg(ride.state),
          )}
          aria-hidden
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-sans text-base font-semibold leading-tight text-foreground">
            {ride.title}
          </h3>
          <span className="shrink-0 font-sans text-lg font-bold leading-none text-foreground tabular-nums">
            {ride.distanceKm}
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">km</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
              {ride.paceName}
            </Badge>
            <span className="truncate font-sans text-xs text-muted-foreground">
              {ride.startTime}
            </span>
          </div>
          <StateLabel state={ride.state} />
        </div>
      </div>
    </article>
  );
}

function HomeHero({ ride }: { ride: MockRide }) {
  return (
    <article
      className={cn(
        'overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow) ring-2',
        stateRingClass(ride.state),
      )}
    >
      <div className="relative h-44 bg-surface-raised">
        <PolylineSvg
          coords={ride.routeShape}
          className="absolute inset-0 h-full w-full text-primary"
          strokeWidth={2.2}
          padding={12}
          showStartEnd
        />
        <div className="absolute inset-x-0 bottom-0 h-12 text-primary">
          <ElevationSvg
            coords={ride.routeShape}
            className="h-full w-full"
            stroke="currentColor"
            fill="currentColor"
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 shadow-(--card-shadow) backdrop-blur">
            <span className={cn('size-2 rounded-full', stateDotBg(ride.state))} aria-hidden />
            <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-foreground">
              {ride.state === 'confirmed'
                ? "You're in"
                : ride.state === 'waitlisted'
                  ? `Waitlisted · #${ride.waitlistPosition}`
                  : 'Open ride'}
            </span>
          </span>
        </div>
        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-0.5">
          <span className="font-sans text-3xl font-bold leading-none text-foreground tabular-nums drop-shadow-sm">
            {ride.distanceKm}
            <span className="ml-1 text-sm font-medium text-muted-foreground">km</span>
          </span>
          <span className="font-sans text-xs font-medium text-muted-foreground">
            {ride.elevationM} m ↑
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-xl font-bold leading-tight text-foreground">
            {ride.title}
          </h2>
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs">
            <MapPin weight="duotone" className="size-4" />
            {ride.startLocation}
          </span>
          <span className="inline-flex items-center gap-1.5 font-sans text-xs">
            <Clock weight="duotone" className="size-4" />
            {ride.dayLabel} · {ride.startTime}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <RiderAvatarStack surface="var(--surface-card)">
            {ride.avatars.slice(0, 4).map((a, i) => (
              <RiderAvatar key={i} avatarUrl={a.avatar_url} name={a.full_name} />
            ))}
            {ride.signupCount > 4 && <RiderAvatarOverflow count={ride.signupCount - 4} />}
          </RiderAvatarStack>
          <span className="font-sans text-xs font-medium text-muted-foreground">
            {ride.countdownLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

export function RouteForwardDirection() {
  return (
    <DirectionShell
      label="01"
      name="Route-forward"
      thesis="The route IS the ride. Show its shape everywhere; distance is the anchor metric."
      borrows={['Hero imagery pattern', 'Price-equivalent prominence (distance)']}
      rejects={['Category pills', 'Favoriting']}
      tradeoff="Privileges route-obsessed riders. Riders who sort the agenda by day or time lose the status icon as a scan anchor — it becomes a small corner dot."
    >
      <HomeHero ride={mockRides.humberConfirmed} />
      <div className="space-y-2.5">
        <ListCard ride={mockRides.humberConfirmed} />
        <ListCard ride={mockRides.frenchmansWaitlist} />
        <ListCard ride={mockRides.scarboroughOpen} />
      </div>
    </DirectionShell>
  );
}
