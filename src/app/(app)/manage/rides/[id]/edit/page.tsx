import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Copy } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  getUserClubMembership,
  getRideById,
  getMeetingLocations,
  getPaceGroups,
  getRideSignups,
  getRideCoLeaders,
} from '@/lib/rides/queries';
import { getClubMembers } from '@/lib/manage/queries';
import { getUserConnections } from '@/lib/integrations/queries';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { RideForm } from '@/components/rides/ride-form';
import { CancelRideButton } from '@/components/rides/cancel-ride-button';
import { SignupRoster } from '@/components/rides/signup-roster';
import { WalkUpRiderForm } from '@/components/rides/walk-up-rider-form';
import { CoLeaderPicker } from '@/components/rides/co-leader-picker';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { MemberStatus, RideStatus } from '@/config/statuses';
import type { UserRole } from '@/config/navigation';

const { rides: ridesContent } = appContent;

export default async function EditRidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;

  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'ride_leader' && userRole !== 'admin') {
    redirect(routes.home);
  }

  const userId = membership.user_id;

  const [ride, meetingLocations, paceGroups, signups, members, connections, coLeaders] =
    await Promise.all([
      getRideById(id),
      getMeetingLocations(membership.club_id),
      getPaceGroups(membership.club_id),
      getRideSignups(id),
      getClubMembers(membership.club_id),
      getUserConnections(userId),
      getRideCoLeaders(id),
    ]);

  if (!ride) notFound();

  // Cancelled rides cannot be edited — redirect to detail page
  if (ride.status === RideStatus.CANCELLED) {
    redirect(routes.ride(id));
  }

  // Past rides cannot be edited
  const rideDate = new Date(ride.ride_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (rideDate < today) {
    redirect(routes.ride(id));
  }

  // Leaders can only edit rides they created or co-lead; admins can edit any ride
  const isCreator = ride.created_by === userId;
  const isCoLeader = coLeaders.some((cl) => cl.user_id === userId);
  if (userRole === 'ride_leader' && !isCreator && !isCoLeader) {
    redirect(routes.ride(id));
  }

  const existingSignupUserIds = signups.map((s) => s.user_id);
  const clubMembersForWalkUp = members
    .filter((m) => m.status === MemberStatus.ACTIVE)
    .map((m) => ({
      user_id: m.user_id,
      name: m.display_name ?? m.full_name,
    }));

  // Eligible co-leaders: active members with ride_leader or admin role, excluding the ride creator
  const eligibleLeaders = members
    .filter(
      (m) =>
        m.status === MemberStatus.ACTIVE &&
        (m.role === 'ride_leader' || m.role === 'admin') &&
        m.user_id !== ride.created_by,
    )
    .map((m) => ({
      user_id: m.user_id,
      name: m.display_name ?? m.full_name,
    }));

  return (
    <DashboardShell>
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
          route_polyline: ride.route_polyline ?? '',
          is_drop_ride: ride.is_drop_ride ?? false,
        }}
        connectedServices={connections.map((c) => c.service)}
        returnTo={returnTo}
      />

      {/* Co-leaders section */}
      <div className="mt-12">
        <SectionHeading className="mb-4">{ridesContent.edit.coLeaders}</SectionHeading>
        <CoLeaderPicker rideId={id} coLeaders={coLeaders} eligibleLeaders={eligibleLeaders} />
      </div>

      {/* Signups section */}
      <div className="mt-12">
        <SectionHeading className="mb-4">{ridesContent.edit.signups}</SectionHeading>
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
    </DashboardShell>
  );
}
