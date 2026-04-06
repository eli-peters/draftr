import { redirect } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react/dist/ssr';
import { createClient, getUser } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { AppearanceSetting } from '@/components/settings/appearance-setting';
import { IntegrationsSetting } from '@/components/settings/integrations-setting';
import { NotificationsSetting } from '@/components/settings/notifications-setting';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { getUserConnections } from '@/lib/integrations/queries';

const { settings: content } = appContent;

export default async function SettingsPage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [{ data: membership }, { data: user, error: userError }, connections] = await Promise.all([
    supabase
      .from('club_memberships')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('users').select('notification_preferences').eq('id', authUser.id).single(),
    getUserConnections(authUser.id),
  ]);

  if (userError?.message) {
    console.error('[settings] Error fetching user preferences:', userError.message);
  }

  const role = membership?.role ?? 'rider';
  const isLeaderOrAbove = role === 'ride_leader' || role === 'admin';
  const prefs = user?.notification_preferences as Record<string, unknown> | null;
  const pushEnabled = prefs?.push !== false;

  return (
    <DashboardShell>
      <PageHeader title={content.heading} />

      {/* Preferences Group */}
      <div className="space-y-4">
        <SectionHeading as="h3">{content.preferencesGroup}</SectionHeading>
        <AppearanceSetting />
        <NotificationsSetting pushEnabled={pushEnabled} />
      </div>

      {/* Connections Group — only for leaders and admins */}
      {isLeaderOrAbove && (
        <div className="mt-8 space-y-4">
          <SectionHeading as="h3">{content.connectionsGroup}</SectionHeading>
          <IntegrationsSetting connections={connections} />
        </div>
      )}

      {/* Sign Out (secondary placement) */}
      <div className="mt-12 border-t border-border pt-6 flex justify-center">
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm" className="text-muted-foreground">
            <SignOut className="h-4 w-4" />
            {content.signOut}
          </Button>
        </form>
      </div>
    </DashboardShell>
  );
}
