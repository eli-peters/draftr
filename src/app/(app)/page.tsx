import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import {
  getUserClubMembership,
  getUserNextSignup,
  getLeaderNextLedRide,
  getUserNextWaitlistedRide,
  getRidesNeedingLeaderCount,
  getLeaderWeatherWatchRide,
  getNextAvailableRide,
} from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { getPendingMemberCount } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GreetingSection } from '@/components/dashboard/greeting-section';
import { ActionBar } from '@/components/dashboard/action-bar';
import { CurrentWeather } from '@/components/weather/current-weather';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/config/navigation';
import type { Club } from '@/types/database';

const { dashboard } = appContent;

export default async function HomePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = (membership.club as unknown as Club).timezone;
  const userRole = membership.role as UserRole;
  const isLeader = userRole === 'ride_leader' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const userId = membership.user_id;

  // Fetch profile for greeting — use membership's user_id directly
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // Fetch action bar data + nudge in parallel
  const [
    nextSignup,
    nextLedRide,
    nextWaitlistedRide,
    weatherWatchRide,
    pendingMemberCount,
    ridesNeedingLeaderCount,
    nextAvailableRide,
  ] = await Promise.all([
    getUserNextSignup(userId, membership.club_id),
    isLeader ? getLeaderNextLedRide(userId, membership.club_id) : null,
    getUserNextWaitlistedRide(userId, membership.club_id),
    isLeader ? getLeaderWeatherWatchRide(userId, membership.club_id) : null,
    isAdmin ? getPendingMemberCount(membership.club_id) : 0,
    isAdmin ? getRidesNeedingLeaderCount(membership.club_id) : 0,
    getNextAvailableRide(membership.club_id),
  ]);

  // Filter out rides that have already completed (past their end_time today)
  const isNotCompleted = (r: { ride_date: string; start_time: string; end_time: string | null }) =>
    getRideLifecycle(r.ride_date, r.start_time, r.end_time, timezone) !== 'completed';

  // Filter completed rides from action bar items
  const filteredNextSignup = nextSignup && isNotCompleted(nextSignup) ? nextSignup : null;
  const filteredNextLedRide = nextLedRide && isNotCompleted(nextLedRide) ? nextLedRide : null;
  const filteredNextWaitlistedRide =
    nextWaitlistedRide && isNotCompleted(nextWaitlistedRide) ? nextWaitlistedRide : null;
  const filteredWeatherWatchRide =
    weatherWatchRide && isNotCompleted(weatherWatchRide) ? weatherWatchRide : null;

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

      {/* Empty state — rider has no upcoming signups */}
      {!filteredNextSignup && !filteredNextWaitlistedRide && (
        <EmptyState
          title={nextAvailableRide ? dashboard.nudge.noSignupsTitle : dashboard.nudge.noRidesTitle}
          description={
            nextAvailableRide
              ? dashboard.nudge.noSignupsDescription
              : dashboard.nudge.noRidesDescription
          }
          icon={Bicycle}
          className="mt-10"
        >
          {nextAvailableRide && (
            <Link href={routes.rides} className="mt-4">
              <Button size="sm">{dashboard.nudge.browseCta}</Button>
            </Link>
          )}
        </EmptyState>
      )}

      {/* Role-contextual action bar — only renders if there are items needing attention */}
      <div className="mt-8">
        <ActionBar
          nextSignup={filteredNextSignup}
          nextLedRide={dedupedNextLedRide}
          nextWaitlistedRide={filteredNextWaitlistedRide}
          weatherWatchRide={filteredWeatherWatchRide}
          nextAvailableRide={
            !filteredNextSignup && !filteredNextWaitlistedRide ? nextAvailableRide : null
          }
          pendingMemberCount={pendingMemberCount}
          ridesNeedingLeaderCount={ridesNeedingLeaderCount}
          userRole={userRole}
          timezone={timezone}
        />
      </div>
    </DashboardShell>
  );
}
