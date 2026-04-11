import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Bell } from '@phosphor-icons/react/dist/ssr';
import { AppShell } from '@/components/layout/app-shell';
import { UserPrefsProvider } from '@/components/user-prefs-provider';
import { getNavForRole, type UserRole } from '@/config/navigation';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';
import { getUserClubMembership } from '@/lib/rides/queries';
import { getUser } from '@/lib/supabase/server';
import { getLayoutProfile } from '@/lib/profile/queries';
import { getPinnedAnnouncement } from '@/lib/manage/queries';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { NotificationsLoader } from '@/components/layout/notifications-loader';
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

  // Fetch profile and announcement in parallel (notifications stream separately)
  const [profile, pinnedAnnouncement] = await Promise.all([
    getLayoutProfile(authUser.id),
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

  // Notifications stream into the header after the shell renders.
  const notificationsSlot = (
    <Suspense
      fallback={
        <Bell weight="duotone" className="h-7 w-7 text-primary-foreground opacity-60" aria-hidden />
      }
    >
      <NotificationsLoader userId={authUser.id} />
    </Suspense>
  );

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
        notificationsSlot={notificationsSlot}
        banner={
          pinnedAnnouncement ? <AnnouncementBanner announcement={pinnedAnnouncement} /> : undefined
        }
      >
        {children}
      </AppShell>
    </UserPrefsProvider>
  );
}
