import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUpcomingRides, getUserClubMembership, getPaceGroups } from '@/lib/rides/queries';
import { getRideLifecycle } from '@/lib/rides/lifecycle';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { Club } from '@/types/database';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { FilterableRideFeed } from '@/components/rides/filterable-ride-feed';

const { rides: ridesContent } = appContent;

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const timezone = (membership.club as unknown as Club).timezone;

  const [allRides, paceGroups] = await Promise.all([
    getUpcomingRides(membership.club_id, membership.user_id),
    getPaceGroups(membership.club_id),
  ]);

  // Filter out rides that have already completed (past their end_time today)
  const rides = allRides.filter(
    (r) => getRideLifecycle(r.ride_date, r.start_time, r.end_time, timezone) !== 'completed',
  );

  return (
    <DashboardShell>
      <PageHeader title={ridesContent.feed.heading} />

      <div className="mt-8">
        <Suspense>
          <FilterableRideFeed
            rides={rides}
            paceGroups={paceGroups}
            toolbarLabel={ridesContent.toolbar.allRides(rides.length)}
            emptyTitle={ridesContent.feed.emptyState.title}
            emptyDescription={ridesContent.feed.emptyState.description}
            timezone={timezone}
          />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
