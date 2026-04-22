'use client';

import { MapPin, CloudRain, Sun } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { PolylineSvg, ElevationSvg } from '../polyline-svg';
import { mockRides, type MockRide } from '../mock-data';
import { DirectionShell } from './direction-shell';

function stateDotClass(state: MockRide['state']): string {
  switch (state) {
    case 'confirmed':
      return 'bg-feedback-success-default';
    case 'waitlisted':
      return 'bg-feedback-warning-default';
    case 'weather_watch':
      return 'bg-feedback-warning-default';
    case 'cancelled':
      return 'bg-feedback-error-default';
    default:
      return 'bg-border-default';
  }
}

function stateLabel(ride: MockRide): string {
  if (ride.state === 'confirmed') return 'In';
  if (ride.state === 'waitlisted') return `#${ride.waitlistPosition}`;
  if (ride.state === 'weather_watch') return 'Watch';
  if (ride.state === 'cancelled') return 'Off';
  return '';
}

function ListCard({ ride }: { ride: MockRide }) {
  return (
    <article className="flex items-center gap-3 rounded-(--card-radius) bg-card px-4 py-3.5 shadow-(--card-shadow)">
      <span className={cn('size-2 shrink-0 rounded-full', stateDotClass(ride.state))} aria-hidden />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate font-sans text-sm font-semibold leading-tight text-foreground">
            {ride.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
            <span>{ride.startTime}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{ride.distanceKm} km</span>
            {stateLabel(ride) && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-foreground">{stateLabel(ride)}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
          {ride.paceName}
        </Badge>
      </div>
    </article>
  );
}

function WeatherBadge({ ride }: { ride: MockRide }) {
  if (!ride.weather) return null;
  const Icon =
    ride.weather.condition === 'rain'
      ? CloudRain
      : ride.weather.condition === 'overcast'
        ? CloudRain
        : Sun;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-1 font-sans text-xs font-medium text-foreground">
      <Icon weight="duotone" className="size-3.5" />
      {ride.weather.tempC}°
    </span>
  );
}

function HomeHero({ ride }: { ride: MockRide }) {
  const waitlistBanner =
    ride.state === 'waitlisted' ? `Waitlisted — you're #${ride.waitlistPosition} in line` : null;
  return (
    <article className="overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      {waitlistBanner && (
        <div className="bg-status-waitlisted-bg px-5 py-2">
          <span className="font-sans text-status-label font-bold text-status-label-text">
            {waitlistBanner}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-primary">
            {ride.dayLabel} · {ride.startTime}
          </span>
          <h2 className="font-sans text-2xl font-bold leading-tight text-foreground">
            {ride.title}
          </h2>
        </div>
        <div className="relative h-36 overflow-clip rounded-xl bg-surface-raised text-primary">
          <PolylineSvg
            coords={ride.routeShape}
            className="absolute inset-0 h-full w-full"
            strokeWidth={2.2}
            padding={14}
            showStartEnd
          />
          <div className="absolute inset-x-2 bottom-1 h-8">
            <ElevationSvg
              coords={ride.routeShape}
              className="h-full w-full opacity-60"
              stroke="currentColor"
              fill="currentColor"
            />
          </div>
          <div className="absolute top-3 right-3">
            <WeatherBadge ride={ride} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Distance
            </span>
            <span className="font-sans text-base font-bold text-foreground tabular-nums">
              {ride.distanceKm} km
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Climb
            </span>
            <span className="font-sans text-base font-bold text-foreground tabular-nums">
              {ride.elevationM} m
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Pace
            </span>
            <div className="pt-0.5">
              <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
                {ride.paceName}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
            <MapPin weight="duotone" className="size-4" />
            {ride.startLocation}
          </span>
          <span className="font-sans text-xs text-muted-foreground">{ride.countdownLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <RiderAvatarStack surface="var(--surface-card)">
            {ride.avatars.slice(0, 5).map((a, i) => (
              <RiderAvatar key={i} avatarUrl={a.avatar_url} name={a.full_name} />
            ))}
            {ride.signupCount > 5 && <RiderAvatarOverflow count={ride.signupCount - 5} />}
          </RiderAvatarStack>
          <span className="font-sans text-xs font-medium text-foreground">
            {ride.signupCount} riding
          </span>
        </div>
      </div>
    </article>
  );
}

export function MinimalIndexDirection() {
  return (
    <DirectionShell
      label="05"
      name="Minimal index"
      thesis="The list is a scan surface. Put nothing on it that the hero and detail view don't already do better."
      borrows={['Progressive-disclosure discipline']}
      rejects={['Imagery', 'Social on list', 'Location on list']}
      tradeoff="Cleanest scan. Riders who browse the agenda without opening details lose context (no route, no social, no weather). The list leans entirely on the detail view and home hero to do emotional work."
    >
      <HomeHero ride={mockRides.frenchmansWaitlist} />
      <div className="space-y-2">
        <ListCard ride={mockRides.humberConfirmed} />
        <ListCard ride={mockRides.frenchmansWaitlist} />
        <ListCard ride={mockRides.scarboroughOpen} />
        <ListCard ride={mockRides.highParkCrit} />
      </div>
    </DirectionShell>
  );
}
