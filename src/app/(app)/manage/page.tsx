import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Users,
  MapPin,
  CaretRight,
  CloudRain,
  ArrowsClockwise,
  Bicycle,
  UsersThree,
  ChartLineUp,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getUserClubMembership, getLeaderRides } from "@/lib/rides/queries";
import { getClubMembers, getClubStats, getClubAnnouncements } from "@/lib/manage/queries";
import { createClient } from "@/lib/supabase/server";
import { InviteMemberDialog } from "@/components/manage/invite-member-dialog";
import { MemberList } from "@/components/manage/member-list";
import { AnnouncementsPanel } from "@/components/manage/announcements-panel";
import { SeasonDatesCard } from "@/components/manage/season-dates-card";
import { appContent } from "@/content/app";
import type { UserRole } from "@/config/navigation";

const { manage: content, rides: ridesContent } = appContent;

interface ManageRideData {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  status: string;
  capacity: number | null;
  template_id: string | null;
  meeting_location_name: string | null;
  signup_count: number;
  created_by_name: string | null;
}

function ManageRideItem({ ride }: { ride: ManageRideData }) {
  const capacityPercent = ride.capacity != null ? (ride.signup_count / ride.capacity) * 100 : 0;
  const isCancelled = ride.status === "cancelled";

  return (
    <Link href={`/manage/rides/${ride.id}/edit`} className="block group">
      <div className={`rounded-xl border border-border bg-card p-5 mb-3 ${isCancelled ? "opacity-40" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
              {ride.template_id && (
                <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
              {ride.status === "weather_watch" && (
                <Badge variant="outline" className="shrink-0 text-warning border-warning/50 text-sm gap-1">
                  <CloudRain weight="fill" className="h-3.5 w-3.5" />{ridesContent.status.weatherWatch}
                </Badge>
              )}
              {isCancelled && (
                <Badge variant="outline" className="shrink-0 text-destructive border-destructive/30 text-sm">
                  {ridesContent.status.cancelled}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span>{format(new Date(ride.ride_date), "EEE, MMM d")} at {ride.start_time.slice(0, 5)}</span>
              {ride.meeting_location_name && (
                <span className="flex items-center gap-1.5"><MapPin weight="fill" className="h-3.5 w-3.5" />{ride.meeting_location_name}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Users weight="fill" className="h-3.5 w-3.5" />
                {ride.capacity != null ? `${ride.signup_count}/${ride.capacity}` : ride.signup_count}
              </span>
            </div>
            {ride.created_by_name && (
              <p className="mt-1.5 text-sm text-muted-foreground/60">Created by {ride.created_by_name}</p>
            )}
          </div>
          <CaretRight weight="bold" className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
        </div>
        {ride.capacity != null && !isCancelled && (
          <div className="mt-4 h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function ManagePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  const isAdmin = userRole === "admin";

  // Fetch club settings for season dates
  const { data: club } = await supabase
    .from("clubs")
    .select("settings")
    .eq("id", membership.club_id)
    .single();
  const clubSettings = (club?.settings ?? {}) as Record<string, string>;

  const [rides, members, stats, announcements] = await Promise.all([
    getLeaderRides(user.id, membership.club_id, isAdmin),
    isAdmin ? getClubMembers(membership.club_id) : Promise.resolve([]),
    isAdmin ? getClubStats(membership.club_id) : Promise.resolve(null),
    isAdmin ? getClubAnnouncements(membership.club_id) : Promise.resolve([]),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const upcomingRides = rides.filter((r) => r.ride_date >= today && r.status !== "cancelled");
  const pastRides = rides.filter((r) => r.ride_date < today || r.status === "cancelled");

  const ridesTab = (
    <div className="mt-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{content.rides.upcoming}</h2>
      {upcomingRides.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">{content.rides.noRides}</p>
      ) : (
        <div className="mt-3">
          {upcomingRides.map((ride) => <ManageRideItem key={ride.id} ride={ride} />)}
        </div>
      )}
      {pastRides.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-8">{content.rides.past}</h2>
          <div className="mt-3">
            {pastRides.map((ride) => <ManageRideItem key={ride.id} ride={ride} />)}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{content.heading}</h1>
        <Link href="/manage/rides/new">
          <Button size="sm">
            <Plus weight="bold" className="mr-1.5 h-4 w-4" />{content.rides.createRide}
          </Button>
        </Link>
      </div>

      {isAdmin && stats && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bicycle weight="duotone" className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{stats.totalRides}</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">{content.stats.totalRides}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UsersThree weight="duotone" className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{stats.activeMembers}</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">{content.stats.activeMembers}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ChartLineUp weight="duotone" className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{stats.signupsThisWeek}</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">{content.stats.signupsThisWeek}</p>
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

          <TabsContent value="rides">{ridesTab}</TabsContent>

          <TabsContent value="members">
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground font-medium">{content.members.totalMembers(members.length)}</p>
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
                seasonStart={clubSettings.season_start ?? ""}
                seasonEnd={clubSettings.season_end ?? ""}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-6">{ridesTab}</div>
      )}
    </div>
  );
}
