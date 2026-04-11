import { getRideComments, getCommentReactions } from '@/lib/rides/queries';
import { RideComments } from '@/components/rides/ride-comments';

interface RideCommentsSectionProps {
  rideId: string;
  currentUserId: string | null;
  userRole: string;
  isCancelled: boolean;
}

/**
 * Async server component that fetches comments + reactions independently.
 * Wrapped in Suspense on the ride detail page so it streams after initial paint.
 */
export async function RideCommentsSection({
  rideId,
  currentUserId,
  userRole,
  isCancelled,
}: RideCommentsSectionProps) {
  const comments = await getRideComments(rideId);
  const commentReactions = await getCommentReactions(
    rideId,
    comments.map((c) => c.id),
    currentUserId,
  );

  return (
    <RideComments
      rideId={rideId}
      comments={comments}
      commentReactions={commentReactions}
      currentUserId={currentUserId}
      userRole={userRole}
      isCancelled={isCancelled}
    />
  );
}
