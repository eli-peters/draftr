'use client';

import { useState, useTransition } from 'react';
import { SignupRoster, type SignupEntry } from '@/components/rides/signup-roster';
import { removeRiderFromRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { appContent } from '@/content/app';
import { toast } from 'sonner';

const { roster } = appContent.rides;

interface RideSignupSectionProps {
  rideId: string;
  signups: SignupEntry[];
  createdBy?: string | null;
  coLeaderIds?: string[];
  currentUserId: string | null;
  canRemoveRiders?: boolean;
}

export function RideSignupSection({
  rideId,
  signups,
  createdBy,
  coLeaderIds,
  currentUserId,
  canRemoveRiders,
}: RideSignupSectionProps) {
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string } | null>(
    null,
  );
  const [isRemoving, startRemoveTransition] = useTransition();

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    startRemoveTransition(async () => {
      const result = await removeRiderFromRide(rideId, removeTarget.userId);
      if (result.success) {
        toast.success(roster.removeSuccess(removeTarget.userName));
      } else if (result.error) {
        toast.error(result.error);
      }
      setRemoveTarget(null);
    });
  }

  return (
    <>
      <SignupRoster
        signups={signups}
        createdBy={createdBy}
        coLeaderIds={coLeaderIds}
        currentUserId={currentUserId}
        canRemoveRiders={canRemoveRiders}
        onRemoveRider={
          canRemoveRiders ? (userId, userName) => setRemoveTarget({ userId, userName }) : undefined
        }
      />

      {/* Remove rider confirmation drawer */}
      <ResponsiveDrawer
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        size="auto"
      >
        <DrawerHeader>
          <DrawerTitle>
            {removeTarget ? roster.removeConfirmTitle(removeTarget.userName) : ''}
          </DrawerTitle>
          <DrawerDescription>{roster.removeConfirmDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button variant="destructive" onClick={handleRemoveConfirm} disabled={isRemoving}>
            {isRemoving ? appContent.common.loading : roster.removeRider}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{roster.removeConfirmKeep}</Button>
          </DrawerClose>
        </DrawerFooter>
      </ResponsiveDrawer>
    </>
  );
}
