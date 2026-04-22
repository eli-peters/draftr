'use client';

import { Sparkle, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { Badge } from '@/components/ui/badge';
import { RiderAvatar, RiderAvatarOverflow, RiderAvatarStack } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { mockRides, type MockRide } from '../mock-data';
import { DirectionShell } from './direction-shell';

function stateStripeClass(state: MockRide['state']): string {
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
      return 'bg-border-subtle';
  }
}

function socialHook(ride: MockRide): string | null {
  if (ride.state === 'confirmed') return `You + ${ride.signupCount - 1} going`;
  if (ride.state === 'waitlisted')
    return `${ride.signupCount} going · you're #${ride.waitlistPosition} in line`;
  if (ride.state === 'weather_watch') return `${ride.signupCount} going · weather watch`;
  if (ride.signupCount <= 4) return `Filling up — ${ride.signupCount} going`;
  return `${ride.signupCount} going — popular with your pace`;
}

function ListCard({ ride }: { ride: MockRide }) {
  return (
    <article className="relative flex gap-3 overflow-clip rounded-(--card-radius) bg-card p-4 shadow-(--card-shadow)">
      <span
        className={cn('absolute inset-y-0 left-0 w-1', stateStripeClass(ride.state))}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 pl-1.5">
        <div className="flex items-center justify-between gap-3">
          <RiderAvatarStack surface="var(--surface-card)">
            {ride.avatars.slice(0, 4).map((a, i) => (
              <RiderAvatar key={i} avatarUrl={a.avatar_url} name={a.full_name} />
            ))}
            {ride.signupCount > 4 && <RiderAvatarOverflow count={ride.signupCount - 4} />}
          </RiderAvatarStack>
          <span className="shrink-0 font-sans text-sm font-bold text-foreground tabular-nums">
            {ride.signupCount}
            <span className="ml-0.5 font-normal text-muted-foreground">riding</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-sans text-xs font-medium text-muted-foreground">{socialHook(ride)}</p>
          <h3 className="font-sans text-base font-semibold leading-tight text-foreground">
            {ride.title}
          </h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="font-sans text-xs text-muted-foreground tabular-nums">
            {ride.startTime} · {ride.distanceKm} km
          </span>
        </div>
      </div>
    </article>
  );
}

function HomeHero({ ride }: { ride: MockRide }) {
  return (
    <article className="relative overflow-clip rounded-(--card-radius) bg-card shadow-(--card-shadow)">
      <span
        className={cn('absolute inset-y-0 left-0 w-1.5', stateStripeClass(ride.state))}
        aria-hidden
      />
      <div className="flex flex-col gap-4 p-5 pl-6">
        <div className="flex items-center gap-2">
          <Sparkle weight="fill" className="size-3.5 text-primary" />
          <span className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-primary">
            Popular with your pace
          </span>
        </div>
        <div className="flex items-center justify-center py-1">
          <RiderAvatarStack surface="var(--surface-card)" className="-space-x-3 scale-[1.15]">
            {ride.avatars.slice(0, 7).map((a, i) => (
              <RiderAvatar
                key={i}
                avatarUrl={a.avatar_url}
                name={a.full_name}
                className="size-10"
              />
            ))}
            {ride.signupCount > 7 && <RiderAvatarOverflow count={ride.signupCount - 7} />}
          </RiderAvatarStack>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="font-sans text-sm font-medium text-muted-foreground">
            <UsersThree weight="fill" className="mr-1 inline size-4 align-text-bottom" />
            {socialHook(ride)}
          </p>
          <h2 className="font-sans text-2xl font-bold leading-tight text-foreground">
            {ride.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant={getPaceBadgeVariant(ride.paceSortOrder)} size="sm">
            {ride.paceName}
          </Badge>
          <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-1 font-sans text-xs font-medium text-foreground">
            {ride.distanceKm} km
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-1 font-sans text-xs font-medium text-foreground">
            {ride.countdownLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

export function SocialForwardDirection() {
  return (
    <DirectionShell
      label="02"
      name="Social-forward"
      thesis="You ride with people, not routes. Avatars and 'N riding' are the hook."
      borrows={['Guest-favorite social proof', 'Micro-copy that builds trust']}
      rejects={['Route imagery', 'Distance-as-anchor']}
      tradeoff="Strong for mid-size clubs where avatar variety signals health. Sparse-signup rides feel empty; the emotional payoff is proportional to turnout."
      tone="muted"
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
