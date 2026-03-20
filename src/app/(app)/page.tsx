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
  getClubTags,
} from '@/lib/rides/queries';
import { getPendingMemberCount, getPinnedAnnouncement } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GreetingSection } from '@/components/dashboard/greeting-section';
import { ActionBar } from '@/components/dashboard/action-bar';
import { FilterableRideFeed } from '@/components/rides/filterable-ride-feed';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { EmptyState } from '@/components/ui/empty-state';
import type { UserRole } from '@/config/navigation';

const { dashboard } = appContent;

export default async function HomePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  const isLeader = userRole === 'ride_leader' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const { data: profile } = authUser
    ? await supabase.from('users').select('display_name, full_name').eq('id', authUser.id).single()
    : { data: null };

  const firstName = profile?.display_name ?? profile?.full_name?.split(' ')[0] ?? '';

  // Fetch action bar data + ride feed + filter options in parallel
  const [
    nextSignup,
    nextLedRide,
    nextWaitlistedRide,
    weatherWatchRide,
    pendingMemberCount,
    ridesNeedingLeaderCount,
    pinnedAnnouncement,
    rides,
    paceGroups,
    tags,
  ] = await Promise.all([
    authUser ? getUserNextSignup(authUser.id, membership.club_id) : null,
    isLeader && authUser ? getLeaderNextLedRide(authUser.id, membership.club_id) : null,
    authUser ? getUserNextWaitlistedRide(authUser.id, membership.club_id) : null,
    isLeader && authUser ? getLeaderWeatherWatchRide(authUser.id, membership.club_id) : null,
    isAdmin ? getPendingMemberCount(membership.club_id) : 0,
    isAdmin ? getRidesNeedingLeaderCount(membership.club_id) : 0,
    getPinnedAnnouncement(membership.club_id),
    getUpcomingRides(membership.club_id),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
  ]);

  const subtitle =
    rides.length > 0
      ? `${rides.length} ride${rides.length === 1 ? '' : 's'} coming up`
      : dashboard.noRidesDescription;

  return (
    <DashboardShell>
      <GreetingSection firstName={firstName} subtitle={subtitle} />

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

      {/* Pinned announcement banner */}
      {pinnedAnnouncement && (
        <div className="mt-6">
          <AnnouncementBanner announcement={pinnedAnnouncement} />
        </div>
      )}

      {/* Ride feed — identical for all roles */}
      {rides.length > 0 ? (
        <div className="mt-10">
          <Suspense>
            <FilterableRideFeed
              rides={rides}
              paceGroups={paceGroups}
              tags={tags}
              heading={dashboard.feed.heading}
              emptyTitle={dashboard.noRides}
              emptyDescription={dashboard.noRidesDescription}
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
