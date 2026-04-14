import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ContentTransition } from '@/components/motion/content-transition';
import { createClient, getUser } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PreferencesCard } from '@/components/settings/preferences-card';
import { NotificationsCard } from '@/components/settings/notifications-card';
import { IntegrationsSettingLoader } from '@/components/settings/integrations-setting-loader';
import { AccountCard } from '@/components/settings/account-card';
import { settingsContent } from '@/content/settings';
import { routes } from '@/config/routes';
import { defaultUserPreferences, type UserPreferences } from '@/types/user-preferences';
import { readNotificationPreferences } from '@/types/notification-preferences';

export default async function SettingsPage() {
  const authUser = await getUser();
  if (!authUser) redirect(routes.signIn);

  const supabase = await createClient();

  const [{ data: membership }, { data: user, error: userError }] = await Promise.all([
    supabase
      .from('club_memberships')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('users')
      .select('notification_preferences, user_preferences')
      .eq('id', authUser.id)
      .single(),
  ]);

  if (userError?.message) {
    console.error('[settings] Error fetching user preferences:', userError.message);
  }

  const role = membership?.role ?? 'rider';
  const isLeaderOrAbove = role === 'ride_leader' || role === 'admin';

  // Merge DB values over defaults so missing keys fall back gracefully
  const userPrefs: UserPreferences = {
    ...defaultUserPreferences,
    ...((user?.user_preferences as Partial<UserPreferences>) ?? {}),
  };

  // Normalise legacy/new JSONB into the canonical { channels, events } shape
  const notifPrefs = readNotificationPreferences(user?.notification_preferences);

  return (
    <DashboardShell>
      <PageHeader title={settingsContent.heading} />

      <div className="flex flex-col gap-card-stack">
        <PreferencesCard userPrefs={userPrefs} />

        <NotificationsCard initialPrefs={notifPrefs} email={authUser.email ?? ''} />

        {/* Connections — only for ride leaders and admins; streams independently */}
        {isLeaderOrAbove && (
          <Suspense fallback={<div className="h-32 skeleton-shimmer rounded-(--card-radius)" />}>
            <ContentTransition>
              <IntegrationsSettingLoader userId={authUser.id} />
            </ContentTransition>
          </Suspense>
        )}

        <AccountCard email={authUser.email ?? ''} />
      </div>
    </DashboardShell>
  );
}
