'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cancelRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { actionBar } = appContent.rides;

type DialogStep = 'options' | 'confirm-cancel';

interface SoleLeaderDialogProps {
  rideId: string;
  signupCount: number;
  open: boolean;
  onDismissComplete: () => void;
}

export function SoleLeaderDialog({
  rideId,
  signupCount,
  open,
  onDismissComplete,
}: SoleLeaderDialogProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<DialogStep>('options');
  const editUrl = routes.manageEditRide(rideId, routes.ride(rideId));

  function handleCancelRide() {
    startTransition(async () => {
      const result = await cancelRide(rideId, '');
      if (result.error) {
        toast.error(result.error);
      }
      setLocalOpen(false);
    });
  }

  // Local state lets the dialog close visually (animate out) while the
  // parent's mode resets only after the exit animation completes.
  const [localOpen, setLocalOpen] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setLocalOpen(true);
      setStep('options');
    }
  }

  const cancelDescription =
    signupCount > 1
      ? actionBar.soleLeaderConfirmCancelWarning(signupCount)
      : actionBar.soleLeaderConfirmCancelDescription;

  if (isMobile) {
    return (
      <ResponsiveDrawer
        open={localOpen}
        onOpenChange={(o) => {
          if (!o) {
            setLocalOpen(false);
            onDismissComplete();
          }
        }}
        size="auto"
      >
        {step === 'options' && (
          <>
            <DrawerHeader>
              <DrawerTitle>{actionBar.soleLeaderTitle}</DrawerTitle>
              <DrawerDescription>{actionBar.soleLeaderDescription}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="default" onClick={() => router.push(editUrl)}>
                {actionBar.soleLeaderAddCoLeader}
              </Button>
              <Button variant="destructive" onClick={() => setStep('confirm-cancel')}>
                {actionBar.soleLeaderCancelRide}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost">{actionBar.soleLeaderDismiss}</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
        {step === 'confirm-cancel' && (
          <>
            <DrawerHeader>
              <DrawerTitle>{actionBar.soleLeaderConfirmCancelTitle}</DrawerTitle>
              <DrawerDescription>{cancelDescription}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleCancelRide} disabled={isPending}>
                {isPending ? appContent.common.loading : actionBar.soleLeaderConfirmCancel}
              </Button>
              <Button variant="ghost" onClick={() => setStep('options')} disabled={isPending}>
                {actionBar.soleLeaderDismiss}
              </Button>
            </DrawerFooter>
          </>
        )}
      </ResponsiveDrawer>
    );
  }

  return (
    <Dialog
      open={localOpen}
      onOpenChange={(o) => {
        if (!o) setLocalOpen(false);
      }}
      onOpenChangeComplete={(o) => {
        if (!o) onDismissComplete();
      }}
    >
      <DialogContent className="max-w-lg">
        {step === 'options' && (
          <>
            <DialogHeader>
              <DialogTitle>{actionBar.soleLeaderTitle}</DialogTitle>
              <DialogDescription>{actionBar.soleLeaderDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <DialogClose
                render={<Button variant="ghost">{actionBar.soleLeaderDismiss}</Button>}
              />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => setStep('confirm-cancel')}>
                  {actionBar.soleLeaderCancelRide}
                </Button>
                <Button variant="default" onClick={() => router.push(editUrl)}>
                  {actionBar.soleLeaderAddCoLeader}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
        {step === 'confirm-cancel' && (
          <>
            <DialogHeader>
              <DialogTitle>{actionBar.soleLeaderConfirmCancelTitle}</DialogTitle>
              <DialogDescription>{cancelDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('options')} disabled={isPending}>
                {actionBar.soleLeaderDismiss}
              </Button>
              <Button variant="destructive" onClick={handleCancelRide} disabled={isPending}>
                {isPending ? appContent.common.loading : actionBar.soleLeaderConfirmCancel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
