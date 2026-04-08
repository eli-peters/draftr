import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { createClient, getUser } from '@/lib/supabase/server';
import { routes } from '@/config/routes';
import { dateFormats } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';
import { getProfileViewerAccess } from '@/lib/profile/access';
import { ProfilePage } from '@/components/profile/profile-page';
import type { UserRole } from '@/config/navigation';

export default async function OwnProfilePage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [profile, stats, recentRides, { data: paceGroups }] = await Promise.all([
    getUserProfile(authUser.id),
    getUserProfileStats(authUser.id),
    getUserRecentRides(authUser.id),
    supabase
      .from('pace_groups')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  if (!profile) redirect(routes.signIn);

  const access = await getProfileViewerAccess({
    viewerId: authUser.id,
    viewerRole: profile.role as UserRole,
    subjectId: authUser.id,
    now: new Date(),
  });

  return (
    <ProfilePage
      subject={{
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: profile.role as UserRole,
        memberSince: format(new Date(profile.created_at), dateFormats.monthYear),
        totalRides: stats.totalRides,
        ridesThisMonth: stats.ridesThisMonth,
        bio: profile.bio ?? '',
        preferredPaceGroup: profile.preferred_pace_group ?? '',
        phoneNumber: profile.phone_number ?? '',
        emergencyContactName: profile.emergency_contact_name ?? '',
        emergencyContactPhone: profile.emergency_contact_phone ?? '',
        emergencyContactRelationship: profile.emergency_contact_relationship ?? '',
      }}
      access={access}
      paceGroups={paceGroups ?? []}
      recentRides={recentRides}
    />
  );
}
