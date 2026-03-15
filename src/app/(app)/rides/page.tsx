import { redirect } from "next/navigation";
import { getUpcomingRides, getUserClubMembership } from "@/lib/rides/queries";
import { RideCard } from "@/components/rides/ride-card";
import { Bicycle } from "@phosphor-icons/react/dist/ssr";
import { appContent } from "@/content/app";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const { rides: ridesContent } = appContent;

export default async function RidesPage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const rides = await getUpcomingRides(membership.club_id);

  return (
    <DashboardShell>
      <div>
        <h1 className="text-display text-foreground">{ridesContent.feed.heading}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {rides.length > 0
            ? `${rides.length} ride${rides.length === 1 ? "" : "s"} coming up`
            : ridesContent.feed.emptyState.description}
        </p>
      </div>

      {rides.length > 0 ? (
        <div className="mt-8">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <Bicycle weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">{ridesContent.feed.emptyState.title}</h2>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{ridesContent.feed.emptyState.description}</p>
        </div>
      )}
    </DashboardShell>
  );
}
