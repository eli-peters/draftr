'use client';

import { useRideActionCta } from '@/hooks/use-ride-action-cta';
import { Button } from '@/components/ui/button';
import { RiderAvatarGroup } from '@/components/rides/ride-card-parts';
import { SoleLeaderDialog } from '@/components/rides/sole-leader-dialog';
import { appContent } from '@/content/app';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';
import type { SignupAvatar } from '@/types/database';

const { actionBar } = appContent.rides;

interface RideActionBarProps {
  rideId: string;
  state: RideActionBarState;
  avatars: SignupAvatar[];
  totalCount: number;
  signupCount: number;
}

export function RideActionBar({
  rideId,
  state,
  avatars,
  totalCount,
  signupCount,
}: RideActionBarProps) {
  const {
    mode,
    isPending,
    handleCtaClick,
    handleConfirmLeave,
    handleDismiss,
    ctaLabel,
    confirmLeaveLabel,
  } = useRideActionCta(rideId, state);

  return (
    <>
      <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-[max(var(--bar-inset-x),env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-lg md:hidden">
        <div className="max-h-24 overflow-clip rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur) transition-[max-height,background-color] duration-[--duration-normal] ease-[--ease-out]">
          <div className="px-(--bar-padding-x-action)">
            {/* Main bar — left/right zones */}
            <div className="flex items-center justify-between gap-3 py-(--bar-padding-y)">
              {/* LEFT ZONE */}
              <div className="min-w-0 flex-1">
                {/* Idle — avatar stack + count (also visible behind sole-leader drawer) */}
                {(mode === 'idle' || mode === 'sole-leader-options') && (
                  <RiderAvatarGroup avatars={avatars} totalCount={totalCount} maxVisible={3} />
                )}

                {/* Confirm leave — prompt text */}
                {mode === 'confirm-leave' && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {actionBar.confirmLeaveTitle}
                  </p>
                )}
              </div>

              {/* RIGHT ZONE */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Idle — CTA button (also visible behind sole-leader drawer) */}
                {(mode === 'idle' || mode === 'sole-leader-options') && state.cta && (
                  <Button
                    variant={state.ctaVariant}
                    size="default"
                    onClick={handleCtaClick}
                    disabled={isPending}
                  >
                    {ctaLabel}
                  </Button>
                )}

                {/* Confirm leave — dismiss + confirm */}
                {mode === 'confirm-leave' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDismiss}
                      disabled={isPending}
                    >
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sole leader dialog — opened when sole leader taps Leave */}
      <SoleLeaderDialog
        rideId={rideId}
        signupCount={signupCount}
        open={mode === 'sole-leader-options'}
        onDismissComplete={handleDismiss}
      />
    </>
  );
}
