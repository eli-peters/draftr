import { appContent } from '@/content/app';

export type UserRole = 'rider' | 'ride_leader' | 'admin';

export type IconName =
  | 'house'
  | 'bike'
  | 'calendar-check'
  | 'bell'
  | 'user'
  | 'settings'
  | 'users-three'
  | 'megaphone'
  | 'sliders';

export interface NavItem {
  /** Route path */
  href: string;
  /** Display label (from content layer) */
  label: string;
  /** Icon identifier — resolved to component on the client */
  icon: IconName;
  /** Minimum role required to see this item. If not set, visible to all. */
  requiredRole?: UserRole;
  /** Expandable sub-navigation children (desktop sidebar only). */
  children?: NavItem[];
}

/**
 * Primary navigation items.
 * Rendered as bottom tabs on mobile, sidebar on desktop.
 * Order matters — this is the tab order.
 */
export const primaryNav: NavItem[] = [
  {
    href: '/',
    label: appContent.nav.home,
    icon: 'house',
  },
  {
    href: '/rides',
    label: appContent.nav.rides,
    icon: 'bike',
  },
  {
    href: '/my-rides',
    label: appContent.nav.schedule,
    icon: 'calendar-check',
  },
  {
    href: '/manage',
    label: appContent.nav.manage,
    icon: 'settings',
    requiredRole: 'ride_leader',
  },
];

/**
 * Admin sub-navigation items under "Manage".
 * Desktop sidebar only — mobile bottom nav navigates straight to /manage (rides).
 */
export const manageSubNav: NavItem[] = [
  {
    href: '/manage/rides',
    label: appContent.manage.sections.rides,
    icon: 'bike',
  },
  {
    href: '/manage/members',
    label: appContent.manage.sections.members,
    icon: 'users-three',
  },
  {
    href: '/manage/announcements',
    label: appContent.manage.announcements.heading,
    icon: 'megaphone',
  },
  {
    href: '/manage/settings',
    label: appContent.manage.sections.club,
    icon: 'sliders',
  },
];

/** Look up the display label for a parent route path (e.g. "/rides" → "Rides"). */
export function getParentRouteLabel(parentPath: string, isAdmin = false): string {
  const match = primaryNav.find((item) => item.href === parentPath);
  if (match) {
    if (match.href === '/manage' && isAdmin) return appContent.nav.club;
    return match.label;
  }
  const subMatch = manageSubNav.find((item) => item.href === parentPath);
  if (subMatch) return subMatch.label;
  return appContent.nav.home;
}

/**
 * Filter nav items based on user role.
 * Riders see 4 tabs. Ride leaders and admins see 5 (includes Manage/Club).
 * Admins see "Club" instead of "Manage" in the nav label.
 */
export function getNavForRole(role: UserRole): NavItem[] {
  const roleHierarchy: Record<UserRole, number> = {
    rider: 0,
    ride_leader: 1,
    admin: 2,
  };

  return primaryNav
    .filter((item) => {
      if (!item.requiredRole) return true;
      return roleHierarchy[role] >= roleHierarchy[item.requiredRole];
    })
    .map((item) => {
      if (item.href === '/manage') {
        if (role === 'admin') {
          return { ...item, label: appContent.nav.club };
        }
        // Leaders go straight to /manage/rides (skip server redirect)
        if (role === 'ride_leader') {
          return { ...item, href: '/manage/rides' };
        }
      }
      return item;
    });
}
