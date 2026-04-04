'use client';

import { useState, useTransition } from 'react';
import { signUpForRide, cancelSignUp } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import { RiderAvatarGroup } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';
import type { SignupAvatar } from '@/types/database';

const { actionBar } = appContent.rides;

type BarMode = 'idle' | 'confirm-leave';

interface RideActionBarProps {
  rideId: string;
  state: RideActionBarState;
  avatars: SignupAvatar[];
  totalCount: number;
}

export function RideActionBar({ rideId, state, avatars, totalCount }: RideActionBarProps) {
  const [mode, setMode] = useState<BarMode>('idle');
  const [isPending, startTransition] = useTransition();

  function handleCtaClick() {
    if (!state.cta) return;

    if (state.cta === 'leave' || state.cta === 'leave-waitlist') {
      setMode('confirm-leave');
      return;
    }

    startTransition(async () => {
      await signUpForRide(rideId);
    });
  }

  function handleConfirmLeave() {
    startTransition(async () => {
      await cancelSignUp(rideId);
      setMode('idle');
    });
  }

  function handleDismiss() {
    setMode('idle');
  }

  return (
    <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-[max(var(--bar-inset-x),env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-lg md:hidden">
      <div className="max-h-24 overflow-clip rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur) transition-[max-height,background-color] duration-[--duration-normal] ease-[--ease-out]">
        <div className="px-(--bar-padding-x-action)">
          {/* Main bar — left/right zones */}
          <div className="flex items-center justify-between gap-3 py-(--bar-padding-y)">
            {/* LEFT ZONE */}
            <div className="min-w-0 flex-1">
              {/* Idle — avatar stack + count */}
              {mode === 'idle' && (
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
              {/* Idle — CTA button (all roles) */}
              {mode === 'idle' && state.cta && (
                <Button
                  variant={state.ctaVariant}
                  size="sm"
                  onClick={handleCtaClick}
                  disabled={isPending}
                >
                  {isPending ? appContent.common.loading : state.ctaLabel}
                </Button>
              )}

              {/* Confirm leave — dismiss + confirm */}
              {mode === 'confirm-leave' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isPending}>
                    {actionBar.confirmCancel}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmLeave}
                    disabled={isPending}
                  >
                    {isPending ? appContent.common.loading : actionBar.confirmLeave}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
