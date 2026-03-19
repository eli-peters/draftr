import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Bicycle, UsersThree, ChartLineUp } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  getUserClubMembership,
  getLeaderRides,
  getPaceGroups,
  getClubTags,
} from '@/lib/rides/queries';
import { getClubMembers, getClubStats, getClubAnnouncements } from '@/lib/manage/queries';
import { createClient } from '@/lib/supabase/server';
import { InviteMemberDialog } from '@/components/manage/invite-member-dialog';
import { MemberList } from '@/components/manage/member-list';
import { ManageRidesPanel } from '@/components/manage/manage-rides-panel';
import { AnnouncementsPanel } from '@/components/manage/announcements-panel';
import { SeasonDatesCard } from '@/components/manage/season-dates-card';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { UserRole } from '@/config/navigation';

const { manage: content } = appContent;

export default async function ManagePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  const isAdmin = userRole === 'admin';

  // Fetch club settings for season dates
  const { data: club } = await supabase
    .from('clubs')
    .select('settings')
    .eq('id', membership.club_id)
    .single();
  const clubSettings = (club?.settings ?? {}) as Record<string, string>;

  const [rides, paceGroups, tags, members, stats, announcements] = await Promise.all([
    getLeaderRides(user.id, membership.club_id, isAdmin),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
    isAdmin ? getClubMembers(membership.club_id) : Promise.resolve([]),
    isAdmin ? getClubStats(membership.club_id) : Promise.resolve(null),
    isAdmin ? getClubAnnouncements(membership.club_id) : Promise.resolve([]),
  ]);

  const ridesPanel = <ManageRidesPanel rides={rides} paceGroups={paceGroups} tags={tags} />;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{content.heading}</h1>
        <Link href={routes.manageNewRide}>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {content.rides.createRide}
          </Button>
        </Link>
      </div>

      {isAdmin && stats && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bicycle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{stats.totalRides}</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {content.stats.totalRides}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UsersThree className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{stats.activeMembers}</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {content.stats.activeMembers}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ChartLineUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {stats.signupsThisWeek}
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {content.stats.signupsThisWeek}
            </p>
          </div>
        </div>
      )}

      {isAdmin ? (
        <Tabs defaultValue="rides" className="mt-6">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="rides">{content.sections.rides}</TabsTrigger>
            <TabsTrigger value="members">{content.sections.members}</TabsTrigger>
            <TabsTrigger value="announcements">{content.announcements.heading}</TabsTrigger>
            <TabsTrigger value="club">{content.sections.club}</TabsTrigger>
          </TabsList>

          <TabsContent value="rides">{ridesPanel}</TabsContent>

          <TabsContent value="members">
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground font-medium">
                  {content.members.totalMembers(members.length)}
                </p>
                <InviteMemberDialog clubId={membership.club_id} />
              </div>
              <MemberList members={members} clubId={membership.club_id} currentUserId={user.id} />
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
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-6">{ridesPanel}</div>
      )}
    </div>
  );
}
