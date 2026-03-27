import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/server';
import {
  getUserClubMembership,
  getMeetingLocations,
  getPaceGroups,
  getRideById,
} from '@/lib/rides/queries';
import { getUserConnections } from '@/lib/integrations/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { RideForm } from '@/components/rides/ride-form';
import type { UserRole } from '@/config/navigation';

const { rides: ridesContent } = appContent;

export default async function CreateRidePage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; template?: string }>;
}) {
  const membership = await getUserClubMembership();
  if (!membership) redirect(routes.signIn);

  const userRole = membership.role as UserRole;
  if (userRole !== 'ride_leader' && userRole !== 'admin') {
    redirect(routes.home);
  }

  const { duplicate: duplicateId, template: templateId } = await searchParams;

  const supabase = await createClient();

  const authUser = await getUser();

  const [clubResult, meetingLocations, paceGroups, sourceRide, templateData, connections] =
    await Promise.all([
      supabase.from('clubs').select('settings').eq('id', membership.club_id).single(),
      getMeetingLocations(membership.club_id),
      getPaceGroups(membership.club_id),
      duplicateId ? getRideById(duplicateId) : null,
      templateId
        ? supabase
            .from('ride_templates')
            .select('*')
            .eq('id', templateId)
            .single()
            .then((r) => r.data)
        : null,
      authUser ? getUserConnections(authUser.id) : [],
    ]);

  const clubSettings = (clubResult.data?.settings ?? {}) as Record<string, string>;

  // Pre-fill from duplicated ride (blank out date so leader must pick a new one)
  let initialData;
  if (sourceRide) {
    initialData = {
      title: sourceRide.title,
      description: sourceRide.description ?? '',
      ride_date: '',
      start_time: sourceRide.start_time?.slice(0, 5) ?? '',
      meeting_location_id: sourceRide.meeting_location_id ?? '',
      pace_group_id: sourceRide.pace_group_id ?? '',
      distance_km: sourceRide.distance_km != null ? String(sourceRide.distance_km) : '',
      elevation_m: sourceRide.elevation_m != null ? String(sourceRide.elevation_m) : '',
      capacity: sourceRide.capacity != null ? String(sourceRide.capacity) : '',
      route_name: sourceRide.route_name ?? '',
      route_url: sourceRide.route_url ?? '',
      route_polyline: sourceRide.route_polyline ?? '',
      is_drop_ride: sourceRide.is_drop_ride ?? false,
      organiser_notes: sourceRide.organiser_notes ?? '',
    };
  } else if (templateData) {
    initialData = {
      title: templateData.title,
      description: templateData.description ?? '',
      ride_date: '',
      start_time: templateData.start_time?.slice(0, 5) ?? '',
      meeting_location_id: templateData.meeting_location_id ?? '',
      pace_group_id: templateData.pace_group_id ?? '',
      distance_km:
        templateData.default_distance_km != null ? String(templateData.default_distance_km) : '',
      elevation_m: '',
      capacity: templateData.default_capacity != null ? String(templateData.default_capacity) : '',
      route_name: templateData.default_route_name ?? '',
      route_url: templateData.default_route_url ?? '',
      route_polyline: templateData.default_route_polyline ?? '',
      is_drop_ride: templateData.is_drop_ride ?? false,
      organiser_notes: '',
    };
  }

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {ridesContent.create.heading}
      </h1>
      <RideForm
        clubId={membership.club_id}
        meetingLocations={meetingLocations}
        paceGroups={paceGroups}
        initialData={initialData}
        seasonStart={clubSettings.season_start}
        seasonEnd={clubSettings.season_end}
        connectedServices={connections.map((c) => c.service).filter((s) => s !== 'ridewithgps')}
      />
    </DashboardShell>
  );
}
