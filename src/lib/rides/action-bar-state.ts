import { appContent } from '@/content/app';

const { actionBar } = appContent.rides;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionBarCta = 'join' | 'leave' | 'waitlist' | 'leave-waitlist' | null;

export type ActionBarCtaVariant = 'default' | 'outline' | 'secondary' | 'destructive';

export interface RideActionBarState {
  /** Glanceable left-side text, e.g. "5 of 10 spots" or "You're in · 8 of 10" */
  statusText: string;
  /** Which CTA the rider should see (null = no CTA, e.g. past/cancelled rides) */
  cta: ActionBarCta;
  /** Button label for the CTA */
  ctaLabel: string | null;
  /** Button variant for the CTA */
  ctaVariant: ActionBarCtaVariant;
}

export interface ActionBarInput {
  isSignedUp: boolean;
  isOnWaitlist: boolean;
  waitlistPosition: number | null;
  isFull: boolean;
  isCancelled: boolean;
  isPast: boolean;
  canSignUp: boolean;
  canCancel: boolean;
  confirmedCount: number;
  capacity: number | null;
  /** True when the user is the ride creator with no co-leaders — cannot leave, only cancel */
  isSoleLeader: boolean;
}

// ---------------------------------------------------------------------------
// State derivation
// ---------------------------------------------------------------------------

export function computeRideActionState(params: ActionBarInput): RideActionBarState {
  const {
    isSignedUp,
    isOnWaitlist,
    waitlistPosition,
    isFull,
    isCancelled,
    isPast,
    canSignUp,
    canCancel,
    confirmedCount,
    capacity,
    isSoleLeader,
  } = params;

  // Terminal states — no CTA
  if (isCancelled) {
    return {
      statusText: actionBar.cancelled,
      cta: null,
      ctaLabel: null,
      ctaVariant: 'default',
    };
  }

  if (isPast) {
    return {
      statusText: actionBar.completed,
      cta: null,
      ctaLabel: null,
      ctaVariant: 'default',
    };
  }

  // User is on waitlist
  if (isOnWaitlist) {
    return {
      statusText: waitlistPosition
        ? actionBar.waitlistPosition(waitlistPosition)
        : actionBar.rideFull,
      cta: canCancel ? 'leave-waitlist' : null,
      ctaLabel: canCancel ? actionBar.leaveWaitlist : null,
      ctaVariant: 'destructive',
    };
  }

  // User is signed up (confirmed)
  if (isSignedUp) {
    // Sole leaders cannot leave — they must cancel the ride instead
    const canLeave = canCancel && !isSoleLeader;
    return {
      statusText: actionBar.youreInSpots(confirmedCount, capacity),
      cta: canLeave ? 'leave' : null,
      ctaLabel: canLeave ? actionBar.leaveRide : null,
      ctaVariant: 'destructive',
    };
  }

  // User is NOT signed up — ride is full
  if (isFull) {
    return {
      statusText: actionBar.rideFull,
      cta: canSignUp ? 'waitlist' : null,
      ctaLabel: canSignUp ? actionBar.joinWaitlist : null,
      ctaVariant: 'secondary',
    };
  }

  // User is NOT signed up — spots available
  return {
    statusText: actionBar.spotsOf(confirmedCount, capacity),
    cta: canSignUp ? 'join' : null,
    ctaLabel: canSignUp ? actionBar.joinRide : null,
    ctaVariant: 'default',
  };
}
