import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUpcomingRides, getUserClubMembership, getPaceGroups } from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { FilterableRideFeed } from '@/components/rides/filterable-ride-feed';

const { rides: ridesContent } = appContent;

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const [rides, paceGroups] = await Promise.all([
    getUpcomingRides(membership.club_id, membership.user_id),
    getPaceGroups(membership.club_id),
  ]);

  return (
    <DashboardShell>
      <PageHeader title={ridesContent.feed.heading} />

      <div className="mt-8">
        <Suspense>
          <FilterableRideFeed
            rides={rides}
            paceGroups={paceGroups}
            emptyTitle={ridesContent.feed.emptyState.title}
            emptyDescription={ridesContent.feed.emptyState.description}
          />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
