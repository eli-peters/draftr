import Link from 'next/link';
import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import {
  getUserNextSignup,
  getLeaderNextLedRide,
  getUserNextWaitlistedRide,
  getRidesNeedingLeaderCount,
  getLeaderWeatherWatchRide,
  getNextAvailableRide,
} from '@/lib/rides/queries';
import { getPendingMemberCount } from '@/lib/manage/queries';
import { ActionBar } from '@/components/dashboard/action-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { dashboard } = appContent;

interface DashboardActionContentProps {
  userId: string;
  clubId: string;
  timezone: string;
  userRole: UserRole;
}

/**
 * Async server component — owns all ride-data fetching for the homepage
 * action section. Rendered inside a Suspense boundary so the page shell and
 * greeting stream first; action cards follow once queries resolve.
 */
export async function DashboardActionContent({
  userId,
  clubId,
  timezone,
  userRole,
}: DashboardActionContentProps) {
  const isLeader = userRole === 'ride_leader' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const batchPromise = Promise.all([
    getUserNextSignup(userId, clubId, timezone),
    isLeader ? getLeaderNextLedRide(userId, clubId, timezone) : null,
    getUserNextWaitlistedRide(userId, clubId, timezone),
    isLeader ? getLeaderWeatherWatchRide(userId, clubId, timezone) : null,
    isAdmin ? getPendingMemberCount(clubId) : 0,
    isAdmin ? getRidesNeedingLeaderCount(clubId, timezone) : 0,
  ]);

  const nextAvailableRidePromise = batchPromise.then(
    ([nextSignup, nextLedRide, nextWaitlistedRide]) => {
      const dedupedNextLedRideId =
        nextLedRide && nextSignup && nextLedRide.id === nextSignup.id ? null : nextLedRide?.id;
      const ids = [nextSignup?.id, dedupedNextLedRideId, nextWaitlistedRide?.id].filter(
        (id): id is string => Boolean(id),
      );
      return getNextAvailableRide(clubId, timezone, ids);
    },
  );

  const [
    [
      nextSignup,
      nextLedRide,
      nextWaitlistedRide,
      weatherWatchRide,
      pendingMemberCount,
      ridesNeedingLeaderCount,
    ],
    nextAvailableRide,
  ] = await Promise.all([batchPromise, nextAvailableRidePromise]);

  const dedupedNextLedRide =
    nextLedRide && nextSignup && nextLedRide.id === nextSignup.id ? null : nextLedRide;

  return (
    <>
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

      <div className="mt-8">
        <ActionBar
          nextSignup={nextSignup}
          nextLedRide={dedupedNextLedRide}
          nextWaitlistedRide={nextWaitlistedRide}
          weatherWatchRide={weatherWatchRide}
          nextAvailableRide={nextAvailableRide}
          pendingMemberCount={typeof pendingMemberCount === 'number' ? pendingMemberCount : 0}
          ridesNeedingLeaderCount={
            typeof ridesNeedingLeaderCount === 'number' ? ridesNeedingLeaderCount : 0
          }
          userRole={userRole}
          timezone={timezone}
        />
      </div>
    </>
  );
}
