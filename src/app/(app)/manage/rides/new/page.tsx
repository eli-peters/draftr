import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getUserClubMembership,
  getMeetingLocations,
  getPaceGroups,
  getClubTags,
  getRideById,
  getRideTagIds,
} from '@/lib/rides/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
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

  const [clubResult, meetingLocations, paceGroups, tags, sourceRide, sourceTagIds, templateData] =
    await Promise.all([
      supabase.from('clubs').select('settings').eq('id', membership.club_id).single(),
      getMeetingLocations(membership.club_id),
      getPaceGroups(membership.club_id),
      getClubTags(membership.club_id),
      duplicateId ? getRideById(duplicateId) : null,
      duplicateId ? getRideTagIds(duplicateId) : [],
      templateId
        ? supabase
            .from('ride_templates')
            .select('*')
            .eq('id', templateId)
            .single()
            .then((r) => r.data)
        : null,
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
      is_drop_ride: sourceRide.is_drop_ride ?? false,
      organiser_notes: sourceRide.organiser_notes ?? '',
      tag_ids: sourceTagIds,
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
      is_drop_ride: templateData.is_drop_ride ?? false,
      organiser_notes: '',
      tag_ids: [] as string[],
    };
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {ridesContent.create.heading}
      </h1>
      <RideForm
        clubId={membership.club_id}
        meetingLocations={meetingLocations}
        paceGroups={paceGroups}
        tags={tags}
        initialData={initialData}
        seasonStart={clubSettings.season_start}
        seasonEnd={clubSettings.season_end}
      />
    </div>
  );
}
