import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import {
  getUserClubMembership,
  getRideById,
  getMeetingLocations,
  getPaceGroups,
  getClubTags,
  getRideTagIds,
  getRideSignups,
} from '@/lib/rides/queries';
import { getClubMembers } from '@/lib/manage/queries';
import { RideForm } from '@/components/rides/ride-form';
import { CancelRideButton } from '@/components/rides/cancel-ride-button';
import { SignupRoster } from '@/components/rides/signup-roster';
import { WalkUpRiderForm } from '@/components/rides/walk-up-rider-form';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { MemberStatus, RideStatus } from '@/config/statuses';
import type { UserRole } from '@/config/navigation';

const { rides: ridesContent } = appContent;

export default async function EditRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'ride_leader' && userRole !== 'admin') {
    redirect(routes.home);
  }

  const userId = membership.user_id;

  const [ride, meetingLocations, paceGroups, tags, tagIds, signups, members] = await Promise.all([
    getRideById(id),
    getMeetingLocations(membership.club_id),
    getPaceGroups(membership.club_id),
    getClubTags(membership.club_id),
    getRideTagIds(id),
    getRideSignups(id),
    getClubMembers(membership.club_id),
  ]);

  if (!ride) notFound();

  // Cancelled rides cannot be edited — redirect to detail page
  if (ride.status === RideStatus.CANCELLED) {
    redirect(routes.ride(id));
  }

  // Leaders can only edit rides they created; admins can edit any ride
  if (userRole === 'ride_leader' && ride.created_by !== userId) {
    redirect(routes.ride(id));
  }

  const existingSignupUserIds = signups.map((s) => s.user_id);
  const clubMembersForWalkUp = members
    .filter((m) => m.status === MemberStatus.ACTIVE)
    .map((m) => ({
      user_id: m.user_id,
      name: m.display_name ?? m.full_name,
    }));

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {ridesContent.edit.heading}
        </h1>
        <Link href={`${routes.manageNewRide}?duplicate=${id}`}>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-1.5" />
            {ridesContent.edit.duplicateRide}
          </Button>
        </Link>
      </div>

      <RideForm
        clubId={membership.club_id}
        meetingLocations={meetingLocations}
        paceGroups={paceGroups}
        tags={tags}
        rideId={id}
        templateId={ride.template_id ?? undefined}
        initialData={{
          title: ride.title,
          description: ride.description ?? '',
          ride_date: ride.ride_date,
          start_time: ride.start_time?.slice(0, 5) ?? '',
          meeting_location_id: ride.meeting_location_id ?? '',
          pace_group_id: ride.pace_group_id ?? '',
          distance_km: ride.distance_km != null ? String(ride.distance_km) : '',
          elevation_m: ride.elevation_m != null ? String(ride.elevation_m) : '',
          capacity: ride.capacity != null ? String(ride.capacity) : '',
          route_name: ride.route_name ?? '',
          route_url: ride.route_url ?? '',
          is_drop_ride: ride.is_drop_ride ?? false,
          organiser_notes: ride.organiser_notes ?? '',
          tag_ids: tagIds,
        }}
      />

      {/* Signups section */}
      <div className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {ridesContent.edit.signups}
        </h2>
        <SignupRoster signups={signups} createdBy={ride.created_by} />
        <div className="mt-4">
          <WalkUpRiderForm
            rideId={id}
            clubMembers={clubMembersForWalkUp}
            existingSignupUserIds={existingSignupUserIds}
          />
        </div>
      </div>

      <div className="mt-12">
        <CancelRideButton rideId={id} rideTitle={ride.title} />
      </div>
    </div>
  );
}
