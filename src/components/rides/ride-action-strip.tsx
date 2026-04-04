'use client';

import { useRideActionCta } from '@/hooks/use-ride-action-cta';
import { Button } from '@/components/ui/button';
import { RiderAvatarGroup } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';
import type { SignupAvatar } from '@/types/database';

const { actionBar } = appContent.rides;

interface RideActionStripProps {
  rideId: string;
  state: RideActionBarState;
  avatars: SignupAvatar[];
  totalCount: number;
}

/**
 * Desktop-only horizontal action strip. Sticky below the main header.
 * Same state machine and left/right zone model as the mobile RideActionBar.
 */
export function RideActionStrip({ rideId, state, avatars, totalCount }: RideActionStripProps) {
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
    <div className="my-3 hidden rounded-(--bar-radius-desktop) border border-border/20 bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow-desktop) backdrop-blur-(--bar-backdrop-blur) md:block">
      <div className="px-(--bar-padding-x-desktop)">
        {/* Idle state */}
        {mode === 'idle' && (
          <div className="flex items-center justify-between gap-4 py-(--bar-padding-y-desktop)">
            <div className="min-w-0 flex-1">
              <RiderAvatarGroup avatars={avatars} totalCount={totalCount} maxVisible={3} />
            </div>

            {/* Right: CTA */}
            {state.cta && (
              <Button
                variant={state.ctaVariant}
                size="sm"
                onClick={handleCtaClick}
                disabled={isPending}
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        )}

        {/* Confirm leave */}
        {mode === 'confirm-leave' && (
          <div className="flex items-center justify-between gap-4 py-(--bar-padding-y-desktop)">
            <p className="text-sm font-medium text-muted-foreground">
              {actionBar.confirmLeaveTitle}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isPending}>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
