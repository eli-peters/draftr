import { redirect, notFound } from "next/navigation";
import {
  getUserClubMembership,
  getRideById,
  getMeetingLocations,
  getPaceGroups,
  getClubTags,
  getRideTagIds,
} from "@/lib/rides/queries";
import { RideForm } from "@/components/rides/ride-form";
import type { UserRole } from "@/config/navigation";

export default async function EditRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  if (userRole !== "ride_leader" && userRole !== "admin") {
    redirect("/");
  }

  const [ride, meetingLocations, paceGroups, tags, tagIds] = await Promise.all([
    getRideById(id),
    getMeetingLocations(membership.club_id),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
    getRideTagIds(id),
  ]);

  if (!ride) notFound();

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Ride</h1>
      <RideForm
        clubId={membership.club_id}
        meetingLocations={meetingLocations}
        paceGroups={paceGroups}
        tags={tags}
        rideId={id}
        initialData={{
          title: ride.title,
          description: ride.description ?? "",
          ride_date: ride.ride_date,
          start_time: ride.start_time?.slice(0, 5) ?? "",
          meeting_location_id: ride.meeting_location_id ?? "",
          pace_group_id: ride.pace_group_id ?? "",
          distance_km: ride.distance_km != null ? String(ride.distance_km) : "",
          elevation_m: ride.elevation_m != null ? String(ride.elevation_m) : "",
          capacity: ride.capacity != null ? String(ride.capacity) : "",
          route_name: ride.route_name ?? "",
          route_url: ride.route_url ?? "",
          is_drop_ride: ride.is_drop_ride ?? false,
          organiser_notes: ride.organiser_notes ?? "",
          tag_ids: tagIds,
        }}
      />
    </div>
  );
}
