import { redirect } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Bicycle,
  Path,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { getUpcomingRides, getUserClubMembership } from "@/lib/rides/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { appContent } from "@/content/app";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { HeroRideCard } from "@/components/dashboard/hero-ride-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LeaderLeadsSection } from "@/components/dashboard/leader-leads-section";
import { ClubOverviewSection } from "@/components/dashboard/club-overview-section";
import type { UserRole } from "@/config/navigation";

const { dashboard, profile: profileContent } = appContent;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return dashboard.greeting.morning;
  if (hour < 18) return dashboard.greeting.afternoon;
  return dashboard.greeting.evening;
}

const mockStats = {
  totalRides: 47,
  thisMonth: 3,
  totalDistance: 2840,
  totalElevation: 18500,
};

const mockRecentRides = [
  { id: "3", title: "Don Valley Explorer", ride_date: "2026-03-08", pace_group: "Moderate", distance_km: 55 },
  { id: "4", title: "Lakeshore Cruise", ride_date: "2026-03-01", pace_group: "Social", distance_km: 40 },
  { id: "6", title: "Scarborough Bluffs Ride", ride_date: "2026-02-22", pace_group: "Moderate", distance_km: 60 },
];

const mockLeaderLeads = [
  { id: "1", title: "Saturday Morning Social", ride_date: "2026-03-21", start_time: "07:30", pace_group: "Social", location: "Canary District", signup_count: 18, capacity: 25 as number | null },
  { id: "2", title: "Humber River Loop", ride_date: "2026-03-22", start_time: "08:00", pace_group: "Intermediate", location: "Spadina & Queens Quay", signup_count: 12, capacity: 20 as number | null },
];

const statItems = [
  { label: profileContent.stats.totalRides, value: mockStats.totalRides },
  { label: profileContent.stats.thisMonth, value: mockStats.thisMonth },
  { label: profileContent.stats.distance, value: 2.8, suffix: "k", decimals: 1 },
  { label: profileContent.stats.elevation, value: 18.5, suffix: "k", decimals: 1 },
];

export default async function DashboardPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  const isLeader = userRole === "ride_leader" || userRole === "admin";
  const isAdmin = userRole === "admin";

  const rides = await getUpcomingRides(membership.club_id);
  const nextRide = rides[0] ?? null;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profile } = authUser
    ? await supabase.from("users").select("display_name, full_name").eq("id", authUser.id).single()
    : { data: null };

  const firstName = profile?.display_name ?? profile?.full_name?.split(" ")[0] ?? "";
  const greeting = dashboard.greetingWithName(getGreeting(), firstName);
  const subtitle = rides.length > 0
    ? `${rides.length} ride${rides.length === 1 ? "" : "s"} coming up`
    : dashboard.noNextRideDescription;

  return (
    <DashboardShell>
      <GreetingSection greeting={greeting} subtitle={subtitle} />

      <section className="mt-10">
        <DashboardStats stats={statItems} />
      </section>

      {nextRide ? (
        <section className="mt-12">
          <h2 className="text-section mb-4">{dashboard.nextRide}</h2>
          <HeroRideCard ride={nextRide} />
        </section>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{dashboard.noNextRide}</h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{dashboard.noNextRideDescription}</p>
          <Link href="/rides" className="mt-4">
            <Button variant="gradient" size="sm">Browse Rides</Button>
          </Link>
        </div>
      )}

      {isLeader && <div className="mt-12"><QuickActions role={userRole} /></div>}
      {isLeader && <div className="mt-12"><LeaderLeadsSection leads={mockLeaderLeads} /></div>}
      {isAdmin && <div className="mt-12"><ClubOverviewSection /></div>}

      {mockRecentRides.length > 0 && (
        <section className="mt-12">
          <h2 className="text-section mb-4">{dashboard.recentRides}</h2>
          <div className="space-y-2">
            {mockRecentRides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`} className="block group">
                <div className="flex items-center justify-between rounded-lg border border-border/5 bg-card/50 p-4 press-scale card-hover">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground truncate">{ride.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{format(parseISO(ride.ride_date), "MMM d")}</span>
                      <span className="flex items-center gap-1 text-info">
                        <Path weight="bold" className="h-3.5 w-3.5" />
                        {ride.distance_km} km
                      </span>
                      <span>{ride.pace_group}</span>
                    </div>
                  </div>
                  <CaretRight weight="bold" className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
