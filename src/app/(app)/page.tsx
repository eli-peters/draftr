import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
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
  const isNotCompleted = (r: { ride_date: string; start_time: string; end_time: string | null }) =>
    getRideLifecycle(r.ride_date, r.start_time, r.end_time) !== 'completed';

  const activeRides = rides.filter(isNotCompleted);

  // Home feed shows only rides this user is signed up or waitlisted for
  const myRides = activeRides.filter((r) => r.current_user_signup_status != null);

  // Filter completed rides from action bar items
  const filteredNextSignup = nextSignup && isNotCompleted(nextSignup) ? nextSignup : null;
  const filteredNextLedRide = nextLedRide && isNotCompleted(nextLedRide) ? nextLedRide : null;
  const filteredNextWaitlistedRide =
    nextWaitlistedRide && isNotCompleted(nextWaitlistedRide) ? nextWaitlistedRide : null;

  // Suppress nextLedRide if it refers to the same ride as nextSignup (avoid ActionBar duplication)
  const dedupedNextLedRide =
    filteredNextLedRide && filteredNextSignup && filteredNextLedRide.id === filteredNextSignup.id
      ? null
      : filteredNextLedRide;

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
          nextSignup={filteredNextSignup}
          nextLedRide={dedupedNextLedRide}
          nextWaitlistedRide={filteredNextWaitlistedRide}
          weatherWatchRide={weatherWatchRide}
          pendingMemberCount={pendingMemberCount}
          ridesNeedingLeaderCount={ridesNeedingLeaderCount}
          userRole={userRole}
        />
      </div>

      {/* Ride feed — shows only this user's signed-up rides */}
      {myRides.length > 0 ? (
        <div className="mt-10">
          <Suspense>
            <FilterableRideFeed
              rides={myRides}
              paceGroups={paceGroups}
              toolbarLabel={appContent.rides.toolbar.homeFeed(myRides.length)}
              emptyTitle={dashboard.myRides.emptyTitle}
              emptyDescription={dashboard.myRides.emptyDescription}
              cardVariant="home"
            />
          </Suspense>
        </div>
      ) : (
        <EmptyState
          title={dashboard.myRides.emptyTitle}
          description={dashboard.myRides.emptyDescription}
          icon={Bicycle}
          className="mt-12"
        >
          <Link href={routes.rides} className="mt-4">
            <Button size="sm">{dashboard.myRides.emptyCta}</Button>
          </Link>
        </EmptyState>
      )}
    </DashboardShell>
  );
}
