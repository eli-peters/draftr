'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { DotsThree, PencilSimple, XCircle } from '@phosphor-icons/react';
import { cancelRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { actionBar } = appContent.rides;

interface RideKebabMenuProps {
  rideId: string;
  canCancel: boolean;
  signupCount: number;
}

export function RideKebabMenu({ rideId, canCancel, signupCount }: RideKebabMenuProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirmCancel() {
    startTransition(async () => {
      await cancelRide(rideId, '');
      setCancelOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <DotsThree weight="bold" className="size-5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={routes.manageEditRide(rideId, routes.ride(rideId))} />}
          >
            <PencilSimple />
            {actionBar.editRide}
          </DropdownMenuItem>
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
                <XCircle />
                {actionBar.cancelRide}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionBar.cancelRideDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {signupCount > 0
                ? actionBar.cancelRideWarning(signupCount)
                : actionBar.cancelRideDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={
                <Button variant="outline" size="sm" disabled={isPending}>
                  {actionBar.confirmCancel}
                </Button>
              }
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isPending}
            >
              {isPending ? appContent.common.loading : actionBar.confirmCancelRide}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
