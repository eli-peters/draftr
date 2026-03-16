import { redirect } from "next/navigation";
import {
  Bicycle,
} from "@phosphor-icons/react/dist/ssr";
import {
  getUpcomingRides,
  getUserClubMembership,
  getUserNextSignup,
  getLeaderNextLedRide,
} from "@/lib/rides/queries";
import { createClient } from "@/lib/supabase/server";
import { appContent } from "@/content/app";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { ActionBar } from "@/components/dashboard/action-bar";
import { RideCard } from "@/components/rides/ride-card";
import type { UserRole } from "@/config/navigation";

const { dashboard } = appContent;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return dashboard.greeting.morning;
  if (hour < 18) return dashboard.greeting.afternoon;
  return dashboard.greeting.evening;
}

export default async function HomePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  const isLeader = userRole === "ride_leader" || userRole === "admin";

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profile } = authUser
    ? await supabase.from("users").select("display_name, full_name").eq("id", authUser.id).single()
    : { data: null };

  const firstName = profile?.display_name ?? profile?.full_name?.split(" ")[0] ?? "";
  const greeting = dashboard.greetingWithName(getGreeting(), firstName);

  // Fetch action bar data + ride feed in parallel
  const [nextSignup, nextLedRide, rides] = await Promise.all([
    authUser ? getUserNextSignup(authUser.id, membership.club_id) : null,
    isLeader && authUser ? getLeaderNextLedRide(authUser.id, membership.club_id) : null,
    getUpcomingRides(membership.club_id),
  ]);

  const subtitle = rides.length > 0
    ? `${rides.length} ride${rides.length === 1 ? "" : "s"} coming up`
    : dashboard.noRidesDescription;

  return (
    <DashboardShell>
      <GreetingSection greeting={greeting} subtitle={subtitle} />

      {/* Role-contextual action bar — only renders if there are items needing attention */}
      <div className="mt-8">
        <ActionBar nextSignup={nextSignup} nextLedRide={nextLedRide} />
      </div>

      {/* Ride feed — identical for all roles */}
      {rides.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {dashboard.feed.heading}
          </h2>
          <div>
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{dashboard.noRides}</h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{dashboard.noRidesDescription}</p>
        </div>
      )}
    </DashboardShell>
  );
}
