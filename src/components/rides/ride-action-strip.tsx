'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { PencilSimple } from '@phosphor-icons/react';
import { signUpForRide, cancelSignUp, cancelRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiderAvatarGroup } from '@/components/rides/ride-card-parts';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';
import type { SignupAvatar } from '@/types/database';

const { actionBar } = appContent.rides;

type StripMode = 'idle' | 'confirm-leave' | 'confirm-cancel-ride';

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
  const [mode, setMode] = useState<StripMode>('idle');
  const [cancelReason, setCancelReason] = useState('');
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

  function handleConfirmCancelRide() {
    startTransition(async () => {
      await cancelRide(rideId, cancelReason);
      setCancelReason('');
      setMode('idle');
    });
  }

  function handleDismiss() {
    setMode('idle');
    setCancelReason('');
  }

  return (
    <div className="sticky top-14 z-30 my-3 hidden rounded-(--bar-radius-desktop) border border-border/20 bg-surface-default/(--bar-bg-opacity) shadow-(--bar-shadow-desktop) backdrop-blur-(--bar-backdrop-blur) md:block">
      <div className="px-(--bar-padding-x)">
        {/* Idle state */}
        {mode === 'idle' && (
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Left: rider avatars or leader actions */}
            <div className="min-w-0 flex-1">
              {!state.isLeaderView && (
                <RiderAvatarGroup avatars={avatars} totalCount={totalCount} maxVisible={3} />
              )}
              {state.isLeaderView && (
                <div className="flex items-center gap-1.5">
                  <Link href={routes.manageEditRide(rideId, routes.ride(rideId))}>
                    <Button variant="ghost" size="sm">
                      <PencilSimple data-icon="inline-start" className="size-4" />
                      {actionBar.editRide}
                    </Button>
                  </Link>
                  {state.showCancelRide && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setMode('confirm-cancel-ride')}
                      disabled={isPending}
                    >
                      {actionBar.cancelRide}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right: CTA */}
            {state.cta && (
              <Button
                variant={state.ctaVariant}
                size="sm"
                onClick={handleCtaClick}
                disabled={isPending}
              >
                {isPending ? appContent.common.loading : state.ctaLabel}
              </Button>
            )}

            {/* Sole leader: no leave CTA, show muted label */}
            {!state.cta && state.isLeaderView && (
              <p className="text-xs text-muted-foreground">{actionBar.leadingThisRide}</p>
            )}
          </div>
        )}

        {/* Confirm leave */}
        {mode === 'confirm-leave' && (
          <div className="flex items-center justify-between gap-4 py-3">
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
                {isPending ? appContent.common.loading : actionBar.confirmLeave}
              </Button>
            </div>
          </div>
        )}

        {/* Confirm cancel ride */}
        {mode === 'confirm-cancel-ride' && (
          <div
            className={cn(
              'space-y-2 px-3 py-3 transition-colors duration-[--duration-normal]',
              'bg-(--feedback-error-bg)/60',
            )}
          >
            {state.signupCount > 0 && (
              <p className="text-xs font-medium text-destructive">
                {actionBar.cancelRideWarning(state.signupCount)}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder={actionBar.cancelReasonPlaceholder}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="h-9 flex-1 text-sm"
                autoFocus
              />
              <Button variant="outline" size="sm" onClick={handleDismiss} disabled={isPending}>
                {actionBar.confirmCancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancelRide}
                disabled={isPending}
              >
                {isPending ? appContent.common.loading : actionBar.confirmCancelRide}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
