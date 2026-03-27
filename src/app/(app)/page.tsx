import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import {
  getUpcomingRides,
  getUserClubMembership,
  getUserNextSignup,
  getLeaderNextLedRide,
  getUserNextWaitlistedRide,
  getRidesNeedingLeaderCount,
  getLeaderWeatherWatchRide,
  getPaceGroups,
} from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { getPendingMemberCount } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GreetingSection } from '@/components/dashboard/greeting-section';
import { ActionBar } from '@/components/dashboard/action-bar';
import { FilterableRideFeed } from '@/components/rides/filterable-ride-feed';
import { CurrentWeather } from '@/components/weather/current-weather';

import { EmptyState } from '@/components/ui/empty-state';
import type { UserRole } from '@/config/navigation';

const { dashboard } = appContent;

export default async function HomePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  const isLeader = userRole === 'ride_leader' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const userId = membership.user_id;

  // Fetch profile for greeting — use membership's user_id directly
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, full_name')
    .eq('id', userId)
    .single();

  const firstName = profile?.display_name ?? profile?.full_name?.split(' ')[0] ?? '';

  // Fetch action bar data + ride feed + filter options in parallel
  const [
    nextSignup,
    nextLedRide,
    nextWaitlistedRide,
    weatherWatchRide,
    pendingMemberCount,
    ridesNeedingLeaderCount,
    rides,
    paceGroups,
  ] = await Promise.all([
    getUserNextSignup(userId, membership.club_id),
    isLeader ? getLeaderNextLedRide(userId, membership.club_id) : null,
    getUserNextWaitlistedRide(userId, membership.club_id),
    isLeader ? getLeaderWeatherWatchRide(userId, membership.club_id) : null,
    isAdmin ? getPendingMemberCount(membership.club_id) : 0,
    isAdmin ? getRidesNeedingLeaderCount(membership.club_id) : 0,
    getUpcomingRides(membership.club_id, userId),
    getPaceGroups(membership.club_id),
  ]);

  // Filter out rides that have already completed (past their end_time today)
  const activeRides = rides.filter(
    (r) => getRideLifecycle(r.ride_date, r.start_time, r.end_time) !== 'completed',
  );

  return (
    <DashboardShell>
      <GreetingSection firstName={firstName} />

      {/* Current weather widget — client component, uses browser geolocation */}
      <div className="mt-4">
        <CurrentWeather />
      </div>

      {/* Role-contextual action bar — only renders if there are items needing attention */}
      <div className="mt-8">
        <ActionBar
          nextSignup={nextSignup}
          nextLedRide={nextLedRide}
          nextWaitlistedRide={nextWaitlistedRide}
          weatherWatchRide={weatherWatchRide}
          pendingMemberCount={pendingMemberCount}
          ridesNeedingLeaderCount={ridesNeedingLeaderCount}
          userRole={userRole}
        />
      </div>

      {/* Ride feed — identical for all roles */}
      {activeRides.length > 0 ? (
        <div className="mt-10">
          <Suspense>
            <FilterableRideFeed
              rides={activeRides}
              paceGroups={paceGroups}
              toolbarLabel={appContent.rides.toolbar.homeFeed(activeRides.length)}
              emptyTitle={dashboard.noRides}
              emptyDescription={dashboard.noRidesDescription}
              cardVariant="home"
            />
          </Suspense>
        </div>
      ) : (
        <EmptyState
          title={dashboard.noRides}
          description={dashboard.noRidesDescription}
          icon={Bicycle}
          className="mt-12"
        />
      )}
    </DashboardShell>
  );
}
