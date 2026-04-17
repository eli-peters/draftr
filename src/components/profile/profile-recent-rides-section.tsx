import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRecentRides } from '@/lib/profile/queries';
import { defaultUserPreferences } from '@/types/user-preferences';
import { ProfileRecentRides } from './profile-recent-rides';
import type { UserPreferences } from '@/types/user-preferences';

/**
 * Async server component that independently fetches recent rides and renders
 * the recent rides card. Designed to be wrapped in a Suspense boundary on the
 * profile page so the identity hero can paint before rides resolve.
 */
export async function ProfileRecentRidesSection({ userId }: { userId: string }) {
  const [rides, distanceUnit] = await Promise.all([
    getUserRecentRides(userId),
    createAdminClient()
      .from('users')
      .select('user_preferences')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        const prefs = (data?.user_preferences as Partial<UserPreferences>) ?? {};
        return prefs.distance_unit ?? defaultUserPreferences.distance_unit;
      }),
  ]);
  return <ProfileRecentRides rides={rides} distanceUnit={distanceUnit} />;
}
