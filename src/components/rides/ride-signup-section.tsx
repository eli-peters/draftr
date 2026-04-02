'use client';

import { useState } from 'react';
import { SignupRoster } from '@/components/rides/signup-roster';
import { FloatingSignupBar } from '@/components/rides/floating-signup-bar';
import { CancelSignupDrawer } from '@/components/rides/cancel-signup-drawer';

interface SignupEntry {
  id: string;
  status: string;
  signed_up_at: string | null;
  waitlist_position: number | null;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
}

interface RideSignupSectionProps {
  rideId: string;
  signups: SignupEntry[];
  createdBy?: string | null;
  coLeaderIds?: string[];
  currentUserId: string | null;
  isSignedUp: boolean;
  canSignUp: boolean;
  canCancel: boolean;
  isFull: boolean;
}

export function RideSignupSection({
  rideId,
  signups,
  createdBy,
  coLeaderIds,
  currentUserId,
  isSignedUp,
  canSignUp,
  canCancel,
  isFull,
}: RideSignupSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <SignupRoster
        signups={signups}
        createdBy={createdBy}
        coLeaderIds={coLeaderIds}
        currentUserId={currentUserId}
        onCancelSignup={canCancel && isSignedUp ? () => setDrawerOpen(true) : undefined}
      />

      {/* Floating signup bar — visible when not signed up */}
      {canSignUp && !isSignedUp && <FloatingSignupBar rideId={rideId} isFull={isFull} />}

      {/* Cancel confirmation drawer */}
      {canCancel && isSignedUp && (
        <CancelSignupDrawer rideId={rideId} open={drawerOpen} onOpenChange={setDrawerOpen} />
      )}
    </>
  );
}
