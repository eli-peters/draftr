'use client';

import { useTransition } from 'react';
import { HandWaving } from '@phosphor-icons/react';
import { signUpForRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { detail } = appContent.rides;

interface FloatingSignupBarProps {
  rideId: string;
  isFull: boolean;
}

export function FloatingSignupBar({ rideId, isFull }: FloatingSignupBarProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3 md:bottom-0 md:pb-4">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border/50 bg-surface-default/80 p-3 shadow-lg backdrop-blur-md">
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
            <HandWaving data-icon="inline-start" className="size-5" />
            {isPending ? appContent.common.loading : isFull ? detail.joinWaitlist : detail.signUp}
          </Button>
        </div>
      </div>
    </div>
  );
}
