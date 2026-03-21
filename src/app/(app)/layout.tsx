import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getNavForRole, type UserRole } from '@/config/navigation';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { getUserClubMembership } from '@/lib/rides/queries';
import { createClient } from '@/lib/supabase/server';
import { getUserNotifications } from '@/lib/notifications/queries';
import { getPinnedAnnouncement } from '@/lib/manage/queries';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';

/**
 * Authenticated app layout with navigation shell.
 * Fetches the user's club membership to determine role-based nav,
 * and user profile for the header avatar menu.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [membership, supabase] = await Promise.all([getUserClubMembership(), createClient()]);

  const userRole: UserRole = (membership?.role as UserRole) ?? 'rider';
  const navItems = getNavForRole(userRole);

  // Auth guard — redirect unauthenticated users
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    redirect(routes.signIn);
  }

  // Fetch profile (includes onboarding check)
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, display_name, email, avatar_url, onboarding_completed')
    .eq('id', authUser.id)
    .single();

  if (!profile || !profile.onboarding_completed) {
    redirect(routes.setupProfile);
  }

  const userName = profile.display_name ?? profile.full_name ?? 'User';
  const userEmail = profile.email ?? authUser.email ?? '';

  const [notifications, pinnedAnnouncement] = await Promise.all([
    getUserNotifications(authUser.id),
    membership ? getPinnedAnnouncement(membership.club_id, authUser.id) : null,
  ]);
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell
      navItems={navItems}
      user={{
        name: userName,
        email: userEmail,
        initials: getInitials(userName),
        avatarUrl: profile?.avatar_url ?? null,
      }}
      notifications={recentNotifications}
      unreadNotificationCount={unreadCount}
      banner={
        pinnedAnnouncement ? <AnnouncementBanner announcement={pinnedAnnouncement} /> : undefined
      }
    >
      {children}
    </AppShell>
  );
}
