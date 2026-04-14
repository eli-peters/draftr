'use client';

import { useTransition } from 'react';
import { HandWaving } from '@phosphor-icons/react/dist/ssr';
import { signUpForRide, cancelSignUp } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { appContent } from '@/content/app';

const { detail } = appContent.rides;

interface SignupButtonProps {
  rideId: string;
  isSignedUp: boolean;
  isCancelled: boolean;
  isFull?: boolean;
}

export function SignupButton({ rideId, isSignedUp, isCancelled, isFull }: SignupButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isCancelled) {
    return (
      <Button disabled className="w-full" variant="secondary" size="lg">
        {detail.cancelled}
      </Button>
    );
  }

  if (isSignedUp) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await cancelSignUp(rideId);
          });
        }}
      >
        {isPending ? <ButtonSpinner className="size-5" /> : detail.cancelSignUp}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="lg"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signUpForRide(rideId);
        });
      }}
    >
      {isPending ? (
        <ButtonSpinner className="size-5" />
      ) : (
        <HandWaving data-icon="inline-start" className="size-5" />
      )}
      {isPending ? appContent.common.loading : isFull ? detail.joinWaitlist : detail.signUp}
    </Button>
  );
}
