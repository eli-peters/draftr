import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { UserPrefsProvider } from '@/components/user-prefs-provider';
import { getNavForRole, type UserRole } from '@/config/navigation';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { getUserClubMembership } from '@/lib/rides/queries';
import { createClient, getUser } from '@/lib/supabase/server';
import { getUserNotifications } from '@/lib/notifications/queries';
import { getPinnedAnnouncement } from '@/lib/manage/queries';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { defaultUserPreferences, type UserPreferences } from '@/types/user-preferences';

/**
 * Authenticated app layout with navigation shell.
 * Fetches the user's club membership to determine role-based nav,
 * and user profile for the header avatar menu.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [membership, authUser] = await Promise.all([getUserClubMembership(), getUser()]);

  // Auth guard — redirect unauthenticated users
  if (!authUser) {
    redirect(routes.signIn);
  }

  const userRole: UserRole = (membership?.role as UserRole) ?? 'rider';
  const navItems = getNavForRole(userRole);

  // Fetch profile, notifications, and announcement in parallel
  const supabase = await createClient();
  const [{ data: profile }, notifications, pinnedAnnouncement] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, email, avatar_url, onboarding_completed, user_preferences')
      .eq('id', authUser.id)
      .single(),
    getUserNotifications(authUser.id),
    membership ? getPinnedAnnouncement(membership.club_id, authUser.id) : null,
  ]);

  if (!profile || !profile.onboarding_completed) {
    redirect(routes.setupProfile);
  }

  const userName = profile.full_name ?? 'User';
  const userPrefs: UserPreferences = {
    ...defaultUserPreferences,
    ...((profile.user_preferences as Partial<UserPreferences>) ?? {}),
  };

  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <UserPrefsProvider initialPrefs={userPrefs}>
      <AppShell
        navItems={navItems}
        isAdmin={userRole === 'admin'}
        userRole={userRole}
        user={{
          name: userName,
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
    </UserPrefsProvider>
  );
}
