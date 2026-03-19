import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  getUpcomingRides,
  getUserClubMembership,
  getPaceGroups,
  getClubTags,
} from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { FilterableRideFeed } from '@/components/rides/filterable-ride-feed';

const { rides: ridesContent } = appContent;

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const [rides, paceGroups, tags] = await Promise.all([
    getUpcomingRides(membership.club_id),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
  ]);

  return (
    <DashboardShell>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {ridesContent.feed.heading}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {rides.length > 0
            ? `${rides.length} ride${rides.length === 1 ? '' : 's'} coming up`
            : ridesContent.feed.emptyState.description}
        </p>
      </div>

      <div className="mt-8">
        <Suspense>
          <FilterableRideFeed
            rides={rides}
            paceGroups={paceGroups}
            tags={tags}
            emptyTitle={ridesContent.feed.emptyState.title}
            emptyDescription={ridesContent.feed.emptyState.description}
          />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
