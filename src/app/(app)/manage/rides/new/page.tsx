import { redirect } from "next/navigation";
import { getUserClubMembership, getMeetingLocations, getPaceGroups, getClubTags } from "@/lib/rides/queries";
import { appContent } from "@/content/app";
import { RideForm } from "@/components/rides/ride-form";
import type { UserRole } from "@/config/navigation";

const { rides: ridesContent } = appContent;

export default async function CreateRidePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  if (userRole !== "ride_leader" && userRole !== "admin") {
    redirect("/");
  }

  const [meetingLocations, paceGroups, tags] = await Promise.all([
    getMeetingLocations(membership.club_id),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
  ]);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{ridesContent.create.heading}</h1>
      <RideForm
        clubId={membership.club_id}
        meetingLocations={meetingLocations}
        paceGroups={paceGroups}
        tags={tags}
      />
    </div>
  );
}
