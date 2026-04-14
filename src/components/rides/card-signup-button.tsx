'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr';
import { signUpForRide, cancelSignUp } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { appContent } from '@/content/app';
import { SignupStatus } from '@/config/statuses';

const { card } = appContent.rides;

// Cooldown between same-direction actions to prevent rapid toggle (ms)
const ACTION_COOLDOWN_MS = 5000;

import { TOAST_ACTION_STYLES } from '@/lib/toast-styles';

interface CardSignupButtonProps {
  rideId: string;
  rideName: string;
  isFull: boolean;
  userStatus: 'confirmed' | 'waitlisted' | null;
}

export function CardSignupButton({ rideId, rideName, isFull, userStatus }: CardSignupButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<
    'confirmed' | 'waitlisted' | null | undefined
  >(undefined);
  const lastActionRef = useRef<{ type: 'signup' | 'undo'; time: number } | null>(null);
  const signupToastRef = useRef<string | number | null>(null);

  // Reset optimistic state when server data catches up
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync optimistic with server
  useEffect(() => setOptimisticStatus(undefined), [userStatus]);

  // Optimistic state takes precedence over server state when set
  const effectiveStatus = optimisticStatus !== undefined ? optimisticStatus : userStatus;

  // Only rate-limit if the same action type is repeated rapidly
  // signup → undo is always allowed; signup → signup within 5s is blocked
  function isRateLimited(actionType: 'signup' | 'undo'): boolean {
    const last = lastActionRef.current;
    if (last && last.type === actionType && Date.now() - last.time < ACTION_COOLDOWN_MS) {
      toast.warning(card.rateLimited, { duration: 4000 });
      return true;
    }
    return false;
  }

  function handleSignup(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isRateLimited('signup')) return;

    startTransition(async () => {
      const result = await signUpForRide(rideId);
      lastActionRef.current = { type: 'signup', time: Date.now() };

      if (result.error) {
        toast.error(card.signupError, { duration: 6000 });
        return;
      }

      const status = result.status as 'confirmed' | 'waitlisted';
      setOptimisticStatus(status);

      if (status === SignupStatus.WAITLISTED) {
        signupToastRef.current = toast.info(card.waitlistSuccess(rideName), {
          duration: 6000,
          description: card.waitlistDescription,
          action: { label: card.undo, onClick: handleUndo },
          actionButtonStyle: TOAST_ACTION_STYLES.info,
        });
      } else {
        signupToastRef.current = toast.success(card.signupSuccess(rideName), {
          duration: 6000,
          description: card.signupDescription,
          action: { label: card.undo, onClick: handleUndo },
          actionButtonStyle: TOAST_ACTION_STYLES.success,
        });
      }
    });
  }

  function handleUndo() {
    if (isRateLimited('undo')) return;

    startTransition(async () => {
      const result = await cancelSignUp(rideId);
      lastActionRef.current = { type: 'undo', time: Date.now() };

      if (result.error) {
        toast.error(card.signupError, { duration: 6000 });
        return;
      }

      // Dismiss the signup/waitlist toast before showing confirmation
      if (signupToastRef.current) toast.dismiss(signupToastRef.current);

      setOptimisticStatus(null);
      toast.info(card.undone(rideName), {
        duration: 4000,
        description: card.undoneDescription,
        icon: <ArrowCounterClockwise weight="fill" className="size-7" />,
      });
    });
  }

  // Already signed up or waitlisted — banner handles this, hide button
  if (effectiveStatus === SignupStatus.CONFIRMED || effectiveStatus === SignupStatus.WAITLISTED) {
    return null;
  }

  // Not signed up — show action button
  return (
    <Button size="sm" className="shrink-0" disabled={isPending} onClick={handleSignup}>
      {isPending ? <ButtonSpinner /> : isFull ? card.joinWaitlist : card.joinRide}
    </Button>
  );
}
