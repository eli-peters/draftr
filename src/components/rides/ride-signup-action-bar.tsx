'use client';

import { useRideActionCta } from '@/hooks/use-ride-action-cta';
import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { RiderAvatarGroup } from '@/components/rides/ride-card-parts';
import { SoleLeaderDialog } from '@/components/rides/sole-leader-dialog';
import { appContent } from '@/content/app';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';
import type { SignupAvatar } from '@/types/database';

const { actionBar } = appContent.rides;

interface RideSignupActionBarProps {
  rideId: string;
  state: RideActionBarState;
  avatars: SignupAvatar[];
  totalCount: number;
  signupCount: number;
}

/**
 * Signup / cancel action bar for the ride detail page. Renders a single
 * ActionBar for both mobile and desktop; breakpoint-specific positioning is
 * handled entirely by the primitive. Owns the idle → confirm-leave →
 * sole-leader-options state machine via useRideActionCta.
 */
export function RideSignupActionBar({
  rideId,
  state,
  avatars,
  totalCount,
  signupCount,
}: RideSignupActionBarProps) {
  const {
    mode,
    isPending,
    handleCtaClick,
    handleConfirmLeave,
    handleDismiss,
    ctaLabel,
    confirmLeaveLabel,
  } = useRideActionCta(rideId, state);

  const isIdle = mode === 'idle' || mode === 'sole-leader-options';

  return (
    <>
      <ActionBar
        transitioning
        left={
          isIdle ? (
            <RiderAvatarGroup avatars={avatars} totalCount={totalCount} maxVisible={2} />
          ) : (
            <p className="truncate text-sm font-medium text-muted-foreground">
              {actionBar.confirmLeaveTitle}
            </p>
          )
        }
        right={
          isIdle ? (
            state.cta && (
              <Button
                variant={state.ctaVariant}
                size="default"
                onClick={handleCtaClick}
                disabled={isPending}
              >
                {ctaLabel}
              </Button>
            )
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={isPending}>
                {actionBar.confirmCancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmLeave}
                disabled={isPending}
              >
                {confirmLeaveLabel}
              </Button>
            </>
          )
        }
      />

      <SoleLeaderDialog
        rideId={rideId}
        signupCount={signupCount}
        open={mode === 'sole-leader-options'}
        onDismissComplete={handleDismiss}
      />
    </>
  );
}
