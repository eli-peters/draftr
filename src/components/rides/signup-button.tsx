"use client";

import { useTransition } from "react";
import { signUpForRide, cancelSignUp } from "@/lib/rides/actions";
import { Button } from "@/components/ui/button";
import { appContent } from "@/content/app";

const { detail } = appContent.rides;

interface SignupButtonProps {
  rideId: string;
  isSignedUp: boolean;
  isCancelled: boolean;
}

/**
 * One-tap sign-up / cancel button for ride detail page.
 * Optimistic UI — disables during transition.
 */
export function SignupButton({ rideId, isSignedUp, isCancelled }: SignupButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isCancelled) {
    return (
      <Button disabled className="w-full" variant="secondary">
        {detail.cancelled}
      </Button>
    );
  }

  if (isSignedUp) {
    return (
      <Button
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await cancelSignUp(rideId);
          });
        }}
      >
        {isPending ? appContent.common.loading : detail.cancelSignUp}
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signUpForRide(rideId);
        });
      }}
    >
      {isPending ? appContent.common.loading : detail.signUp}
    </Button>
  );
}
