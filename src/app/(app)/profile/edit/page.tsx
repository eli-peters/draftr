import { redirect } from 'next/navigation';
import { createClient, getUser } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/profile/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ProfileEditForm } from './profile-edit-form';

const { profile: content, auth } = appContent;

export default async function ProfileEditPage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [profile, { data: userFull }, { data: paceGroups }] = await Promise.all([
    getUserProfile(authUser.id),
    supabase
      .from('users')
      .select('emergency_contact_name, emergency_contact_phone')
      .eq('id', authUser.id)
      .single(),
    supabase.from('pace_groups').select('id, name').order('sort_order', { ascending: true }),
  ]);

  if (!profile) redirect(routes.signIn);

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{content.editButton}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{auth.setupProfile.subheading}</p>

      <ProfileEditForm
        profile={{
          bio: profile.bio ?? '',
          preferred_pace_group: profile.preferred_pace_group ?? '',
          emergency_contact_name: userFull?.emergency_contact_name ?? '',
          emergency_contact_phone: userFull?.emergency_contact_phone ?? '',
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
        }}
        paceGroups={paceGroups ?? []}
      />
    </DashboardShell>
  );
}
