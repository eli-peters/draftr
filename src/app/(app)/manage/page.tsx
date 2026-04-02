import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Bicycle, UsersThree, ChartLineUp } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { PageHeader } from '@/components/layout/page-header';
import { ContentToolbar } from '@/components/layout/content-toolbar';
import { getUserClubMembership, getLeaderRides, getPaceGroups } from '@/lib/rides/queries';
import {
  getClubMembers,
  getClubStats,
  getClubAnnouncements,
  getPaceTiersWithUsage,
} from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { InviteMemberDrawer } from '@/components/manage/invite-member-drawer';
import { MemberList } from '@/components/manage/member-list';
import { ManageRidesPanel } from '@/components/manage/manage-rides-panel';
import { AnnouncementsPanel } from '@/components/manage/announcements-panel';
import { SeasonDatesCard } from '@/components/manage/season-dates-card';
import { PaceTiersCard } from '@/components/manage/pace-tiers-card';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; pace?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab ?? 'rides';
  const initialPaceFilter = params.pace ?? null;

  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  const isAdmin = userRole === 'admin';

  // Fetch club settings for season dates
  const supabase = await createClient();
  const { data: club } = await supabase
    .from('clubs')
    .select('settings')
    .eq('id', membership.club_id)
    .single();
  const clubSettings = (club?.settings ?? {}) as Record<string, string>;

  const [rides, paceGroups, members, stats, announcements, paceTiersWithUsage] = await Promise.all([
    getLeaderRides(membership.user_id, membership.club_id, isAdmin),
    getPaceGroups(membership.club_id),
    isAdmin ? getClubMembers(membership.club_id) : Promise.resolve([]),
    isAdmin ? getClubStats(membership.club_id) : Promise.resolve(null),
    isAdmin ? getClubAnnouncements(membership.club_id) : Promise.resolve([]),
    isAdmin ? getPaceTiersWithUsage(membership.club_id) : Promise.resolve([]),
  ]);

  const ridesPanel = (
    <ManageRidesPanel rides={rides} paceGroups={paceGroups} initialPaceFilter={initialPaceFilter} />
  );

  return (
    <DashboardShell>
      <PageHeader
        title={isAdmin ? content.headingAdmin : content.headingLeader}
        actions={
          <Link href={routes.manageNewRide}>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              {content.rides.createRide}
            </Button>
          </Link>
        }
      />

      {isAdmin && stats && (
        <StatsGrid
          className="mt-6 grid-cols-3 sm:grid-cols-3"
          stats={[
            { label: content.stats.totalRides, value: stats.totalRides, icon: Bicycle },
            { label: content.stats.activeMembers, value: stats.activeMembers, icon: UsersThree },
            {
              label: content.stats.signupsThisWeek,
              value: stats.signupsThisWeek,
              icon: ChartLineUp,
            },
          ]}
        />
      )}

      {isAdmin ? (
        <Tabs defaultValue={activeTab} key={activeTab} className="mt-6">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="rides">{content.sections.rides}</TabsTrigger>
            <TabsTrigger value="members">{content.sections.members}</TabsTrigger>
            <TabsTrigger value="announcements">{content.announcements.heading}</TabsTrigger>
            <TabsTrigger value="club">{content.sections.club}</TabsTrigger>
          </TabsList>

          <TabsContent value="rides">{ridesPanel}</TabsContent>

          <TabsContent value="members">
            <div className="mt-4">
              <ContentToolbar
                left={
                  <p className="text-sm text-muted-foreground">
                    {content.members.totalMembers(members.length)}
                  </p>
                }
                right={<InviteMemberDrawer clubId={membership.club_id} />}
                className="mb-4"
              />
              <MemberList
                members={members}
                clubId={membership.club_id}
                currentUserId={membership.user_id}
              />
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="mt-4">
              <AnnouncementsPanel announcements={announcements} clubId={membership.club_id} />
            </div>
          </TabsContent>

          <TabsContent value="club">
            <div className="mt-4">
              <SeasonDatesCard
                clubId={membership.club_id}
                seasonStart={clubSettings.season_start ?? ''}
                seasonEnd={clubSettings.season_end ?? ''}
              />
              <PaceTiersCard clubId={membership.club_id} initialTiers={paceTiersWithUsage} />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-6">{ridesPanel}</div>
      )}
    </DashboardShell>
  );
}
