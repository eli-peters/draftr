'use client';

import { useTransition } from 'react';
import { cancelSignUp } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { appContent } from '@/content/app';

const { detail } = appContent.rides;

interface CancelSignupDrawerProps {
  rideId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSignupDrawer({ rideId, open, onOpenChange }: CancelSignupDrawerProps) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      await cancelSignUp(rideId);
      onOpenChange(false);
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{detail.cancelConfirmTitle}</DrawerTitle>
          <DrawerDescription>{detail.cancelConfirmDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? appContent.common.loading : detail.cancelConfirmAction}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{detail.cancelConfirmKeep}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
