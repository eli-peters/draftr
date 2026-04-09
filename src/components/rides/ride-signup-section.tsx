'use client';

import { useState, useTransition } from 'react';
import { SignupRoster, type SignupEntry } from '@/components/rides/signup-roster';
import { removeRiderFromRide } from '@/lib/rides/actions';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from '@/components/ui/alert-dialog';
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

      {/* Remove rider confirmation dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeTarget ? roster.removeConfirmTitle(removeTarget.userName) : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>{roster.removeConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <Button variant="ghost">{roster.removeConfirmKeep}</Button>
            </AlertDialogClose>
            <Button variant="destructive" onClick={handleRemoveConfirm} disabled={isRemoving}>
              {isRemoving ? appContent.common.loading : roster.removeRider}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
