import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { createClient, getUser } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { routes } from '@/config/routes';
import { MemberStatus } from '@/config/statuses';
import { getInitials } from '@/lib/utils';
import { dateFormats } from '@/config/formatting';
import { getUserProfile, getUserProfileStats, getUserRecentRides } from '@/lib/profile/queries';
import { getProfileViewerAccess } from '@/lib/profile/access';
import { ProfilePage } from '@/components/profile/profile-page';
import { appContent } from '@/content/app';
import type { UserRole } from '@/config/navigation';

const { profile: content } = appContent;

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  // Self → redirect to own profile route.
  if (authUser.id === userId) redirect(routes.profile);

  const supabase = await createClient();

  // Viewer role + subject membership status in parallel.
  const [{ data: viewerMembership }, { data: membership }] = await Promise.all([
    supabase
      .from('club_memberships')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('club_memberships').select('status').eq('user_id', userId).maybeSingle(),
  ]);

  const viewerRole: UserRole = (viewerMembership?.role as UserRole) ?? 'rider';

  // Deactivated member placeholder.
  if (membership?.status === MemberStatus.INACTIVE) {
    const { data: basicUser } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();

    const name = basicUser?.full_name ?? 'Member';
    const initials = getInitials(name);

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Avatar className="h-24 w-24 opacity-muted">
          {basicUser?.avatar_url && <AvatarImage src={basicUser.avatar_url} alt={name} />}
          <AvatarFallback className="bg-muted text-2xl font-bold text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{name}</h1>
        <p className="mt-2 text-base text-muted-foreground">{content.publicProfile.deactivated}</p>
      </div>
    );
  }

  const [profile, stats, recentRides, { data: paceGroups }] = await Promise.all([
    getUserProfile(userId),
    getUserProfileStats(userId),
    getUserRecentRides(userId),
    supabase
      .from('pace_groups')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  if (!profile) notFound();

  const access = await getProfileViewerAccess({
    viewerId: authUser.id,
    viewerRole,
    subjectId: userId,
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
