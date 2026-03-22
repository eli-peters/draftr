import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserNotifications } from '@/lib/notifications/queries';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NotificationsList } from './notifications-list';

const { notifications: content } = appContent;

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.signIn);

  const notifications = await getUserNotifications(user.id);

  return (
    <DashboardShell>
      <NotificationsList
        notifications={notifications}
        heading={content.heading}
        markAllReadLabel={content.markAllRead}
        emptyTitle={content.emptyState.title}
        emptyDescription={content.emptyState.description}
      />
    </DashboardShell>
  );
}
