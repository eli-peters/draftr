import { redirect, notFound } from 'next/navigation';
import {
  getUserClubMembership,
  getRideById,
  getPaceGroups,
  getRideSignups,
  getRideCoLeaders,
} from '@/lib/rides/queries';
import { getClubMembers } from '@/lib/manage/queries';
import { getUserConnections } from '@/lib/integrations/queries';
import { routes } from '@/config/routes';
import { MemberStatus, RideStatus } from '@/config/statuses';
import { RideFormPage } from '@/components/rides/ride-form-page';
import type { UserRole } from '@/config/navigation';

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

  const [ride, paceGroups, signups, members, connections, coLeaders] = await Promise.all([
    getRideById(id),
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

  // Eligible co-leaders: active members with ride_leader or admin role, excluding the ride creator
  const eligibleLeaders = members
    .filter(
      (m) =>
        m.status === MemberStatus.ACTIVE &&
        (m.role === 'ride_leader' || m.role === 'admin') &&
        m.user_id !== ride.created_by,
    )
    .map((m) => ({ user_id: m.user_id, name: m.full_name, avatar_url: m.avatar_url }));

  return (
    <RideFormPage
      clubId={membership.club_id}
      paceGroups={paceGroups}
      rideId={id}
      initialData={{
        title: ride.title,
        description: ride.description ?? '',
        ride_date: ride.ride_date,
        start_time: ride.start_time?.slice(0, 5) ?? '',
        pace_group_id: ride.pace_group_id ?? '',
        distance_km: ride.distance_km != null ? String(ride.distance_km) : '',
        elevation_m: ride.elevation_m != null ? String(ride.elevation_m) : '',
        capacity: ride.capacity != null ? String(ride.capacity) : '',
        route_name: ride.route_name ?? '',
        route_url: ride.route_url ?? '',
        route_polyline: ride.route_polyline ?? '',
        is_drop_ride: ride.is_drop_ride ?? false,
        start_location_name: ride.start_location_name ?? '',
        start_location_address: ride.start_location_address ?? '',
        start_latitude: ride.start_latitude,
        start_longitude: ride.start_longitude,
      }}
      connectedServices={connections.map((c) => c.service)}
      eligibleLeaders={eligibleLeaders}
      returnTo={returnTo}
      rideTitle={ride.title}
      initialCoLeaderIds={coLeaders.map((cl) => cl.user_id)}
      signups={signups}
      rideCreatedBy={ride.created_by}
    />
  );
}
