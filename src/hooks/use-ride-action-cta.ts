'use client';

import { useState, useTransition } from 'react';
import { signUpForRide, cancelSignUp } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import type { RideActionBarState } from '@/lib/rides/action-bar-state';

type BarMode = 'idle' | 'confirm-leave' | 'sole-leader-options';

export function useRideActionCta(rideId: string, state: RideActionBarState) {
  const [mode, setMode] = useState<BarMode>('idle');
  const [isPending, startTransition] = useTransition();

  function handleCtaClick() {
    if (!state.cta) return;

    if (state.cta === 'sole-leader') {
      setMode('sole-leader-options');
      return;
    }

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

  return {
    mode,
    isPending,
    handleCtaClick,
    handleConfirmLeave,
    handleDismiss,
    ctaLabel: isPending ? appContent.common.loading : state.ctaLabel,
    confirmLeaveLabel: isPending
      ? appContent.common.loading
      : appContent.rides.actionBar.confirmLeave,
  };
}
