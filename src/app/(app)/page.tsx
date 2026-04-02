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
  // All "next" queries filter out completed same-day rides internally
  const [
    nextSignup,
    nextLedRide,
    nextWaitlistedRide,
    weatherWatchRide,
    pendingMemberCount,
    ridesNeedingLeaderCount,
    nextAvailableRide,
  ] = await Promise.all([
    getUserNextSignup(userId, membership.club_id, timezone),
    isLeader ? getLeaderNextLedRide(userId, membership.club_id, timezone) : null,
    getUserNextWaitlistedRide(userId, membership.club_id, timezone),
    isLeader ? getLeaderWeatherWatchRide(userId, membership.club_id, timezone) : null,
    isAdmin ? getPendingMemberCount(membership.club_id) : 0,
    isAdmin ? getRidesNeedingLeaderCount(membership.club_id, timezone) : 0,
    getNextAvailableRide(membership.club_id, timezone),
  ]);

  // Dedup: suppress cards that refer to the same ride as another card
  const dedupedNextLedRide =
    nextLedRide && nextSignup && nextLedRide.id === nextSignup.id ? null : nextLedRide;

  const personalRideIds = new Set(
    [nextSignup?.id, dedupedNextLedRide?.id, nextWaitlistedRide?.id].filter(Boolean),
  );
  const dedupedNextAvailableRide =
    nextAvailableRide && personalRideIds.has(nextAvailableRide.id) ? null : nextAvailableRide;

  return (
    <DashboardShell>
      <GreetingSection firstName={firstName} />

      {/* Current weather widget — client component, uses browser geolocation */}
      <div>
        <CurrentWeather />
      </div>

      {/* Empty state — rider has no upcoming signups */}
      {!nextSignup && !nextWaitlistedRide && (
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
          nextSignup={nextSignup}
          nextLedRide={dedupedNextLedRide}
          nextWaitlistedRide={nextWaitlistedRide}
          weatherWatchRide={weatherWatchRide}
          nextAvailableRide={dedupedNextAvailableRide}
          pendingMemberCount={pendingMemberCount}
          ridesNeedingLeaderCount={ridesNeedingLeaderCount}
          userRole={userRole}
          timezone={timezone}
        />
      </div>
    </DashboardShell>
  );
}
