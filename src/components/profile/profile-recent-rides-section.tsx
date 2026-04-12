import { getUserRecentRides } from '@/lib/profile/queries';
import { ProfileRecentRides } from './profile-recent-rides';

/**
 * Async server component that independently fetches recent rides and renders
 * the recent rides card. Designed to be wrapped in a Suspense boundary on the
 * profile page so the identity hero can paint before rides resolve.
 */
export async function ProfileRecentRidesSection({ userId }: { userId: string }) {
  const rides = await getUserRecentRides(userId);
  return <ProfileRecentRides rides={rides} />;
}
