import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ContentTransition } from '@/components/motion/content-transition';
import { createClient, getUser } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { routes } from '@/config/routes';
import { MemberStatus } from '@/config/statuses';
import { getInitials } from '@/lib/utils';
import { dateFormats } from '@/config/formatting';
import { getUserProfile, getUserMemberships } from '@/lib/profile/queries';
import { getProfileViewerAccess } from '@/lib/profile/access';
import { ProfilePage } from '@/components/profile/profile-page';
import { ProfileStatsSection } from '@/components/profile/profile-stats-section';
import { ProfileRecentRidesSection } from '@/components/profile/profile-recent-rides-section';
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

  // Viewer role + subject membership status + basic user data in parallel.
  const [{ data: viewerMembership }, { data: membership }, { data: basicUser }] = await Promise.all(
    [
      supabase
        .from('club_memberships')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase.from('club_memberships').select('status').eq('user_id', userId).maybeSingle(),
      supabase.from('users').select('full_name, avatar_url').eq('id', userId).single(),
    ],
  );

  const vRole = viewerMembership?.role;
  const viewerRole: UserRole = vRole === 'admin' || vRole === 'ride_leader' ? vRole : 'rider';

  // Deactivated member placeholder.
  if (membership?.status === MemberStatus.INACTIVE) {
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

  const [profile, { data: paceGroups }, access, memberships] = await Promise.all([
    getUserProfile(userId),
    supabase
      .from('pace_groups')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true }),
    getProfileViewerAccess({
      viewerId: authUser.id,
      viewerRole,
      subjectId: userId,
      now: new Date(),
    }),
    getUserMemberships(userId),
  ]);

  if (!profile) notFound();

  return (
    <ProfilePage
      subject={{
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: profile.role as UserRole,
        memberSince: format(new Date(profile.created_at), dateFormats.monthYear),
        bio: profile.bio ?? '',
        preferredPaceGroup: profile.preferred_pace_group ?? '',
        phoneNumber: profile.phone_number ?? '',
        dateOfBirth: profile.date_of_birth ?? '',
        gender: profile.gender ?? '',
        streetAddress1: profile.street_address_line_1 ?? '',
        streetAddress2: profile.street_address_line_2 ?? '',
        city: profile.city ?? '',
        province: profile.province ?? '',
        postalCode: profile.postal_code ?? '',
        country: profile.country ?? '',
        emergencyContactName: profile.emergency_contact_name ?? '',
        emergencyContactPhone: profile.emergency_contact_phone ?? '',
        emergencyContactRelationship: profile.emergency_contact_relationship ?? '',
      }}
      access={access}
      paceGroups={paceGroups ?? []}
      memberships={memberships}
      statsSlot={
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-22.5 skeleton-shimmer rounded-(--card-radius)" />
              ))}
            </div>
          }
        >
          <ContentTransition>
            <ProfileStatsSection userId={userId} />
          </ContentTransition>
        </Suspense>
      }
      recentRidesSlot={
        <Suspense fallback={<div className="h-48 skeleton-shimmer rounded-(--card-radius)" />}>
          <ContentTransition>
            <ProfileRecentRidesSection userId={userId} />
          </ContentTransition>
        </Suspense>
      }
    />
  );
}
