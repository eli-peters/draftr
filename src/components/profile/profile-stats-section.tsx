import { getUserProfileStats } from '@/lib/profile/queries';
import { ProfileStatsBento } from './profile-stats-bento';

/**
 * Async server component that independently fetches profile stats and renders
 * the stats bento. Designed to be wrapped in a Suspense boundary on the
 * profile page so the identity hero can paint before stats resolve.
 */
export async function ProfileStatsSection({ userId }: { userId: string }) {
  const stats = await getUserProfileStats(userId);
  return <ProfileStatsBento totalRides={stats.totalRides} ridesThisMonth={stats.ridesThisMonth} />;
}
