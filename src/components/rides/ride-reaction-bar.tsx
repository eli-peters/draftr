'use client';

import { ReactionPills } from '@/components/rides/reaction-pills';
import { toggleRideReaction } from '@/lib/rides/actions';
import type { ReactionType, ReactionSummary } from '@/types/database';

interface RideReactionBarProps {
  rideId: string;
  reactions: ReactionSummary[];
  currentUserId: string | null;
}

export function RideReactionBar({ rideId, reactions, currentUserId }: RideReactionBarProps) {
  async function handleToggle(reaction: ReactionType) {
    await toggleRideReaction(rideId, reaction);
  }

  return (
    <ReactionPills reactions={reactions} onToggle={handleToggle} currentUserId={currentUserId} />
  );
}
