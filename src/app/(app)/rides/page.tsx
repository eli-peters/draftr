import { redirect } from "next/navigation";
import { getUpcomingRides, getUserClubMembership } from "@/lib/rides/queries";
import { RideCard } from "@/components/rides/ride-card";
import { appContent } from "@/content/app";

const { feed } = appContent.rides;

export default async function RidesPage() {
  const membership = await getUserClubMembership();

  if (!membership) {
    redirect("/sign-in");
  }

  const rides = await getUpcomingRides(membership.club_id);

  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-foreground">
        {feed.heading}
      </h1>

      {rides.length === 0 ? (
        <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-foreground">
            {feed.emptyState.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {feed.emptyState.description}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
