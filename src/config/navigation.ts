import { appContent } from "@/content/app";

export type UserRole = "rider" | "ride_leader" | "admin";

export type IconName = "house" | "bike" | "calendar-check" | "bell" | "user" | "settings";

export interface NavItem {
  /** Route path */
  href: string;
  /** Display label (from content layer) */
  label: string;
  /** Icon identifier — resolved to component on the client */
  icon: IconName;
  /** Minimum role required to see this item. If not set, visible to all. */
  requiredRole?: UserRole;
}

/**
 * Primary navigation items.
 * Rendered as bottom tabs on mobile, sidebar on desktop.
 * Order matters — this is the tab order.
 */
export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: appContent.nav.home,
    icon: "house",
  },
  {
    href: "/rides",
    label: appContent.nav.rides,
    icon: "bike",
  },
  {
    href: "/my-rides",
    label: appContent.nav.myRides,
    icon: "calendar-check",
  },
  {
    href: "/manage",
    label: appContent.nav.manage,
    icon: "settings",
    requiredRole: "ride_leader",
  },
];

/**
 * Filter nav items based on user role.
 * Riders see 4 tabs. Ride leaders and admins see 5 (includes Manage).
 */
export function getNavForRole(role: UserRole): NavItem[] {
  const roleHierarchy: Record<UserRole, number> = {
    rider: 0,
    ride_leader: 1,
    admin: 2,
  };

  return primaryNav.filter((item) => {
    if (!item.requiredRole) return true;
    return roleHierarchy[role] >= roleHierarchy[item.requiredRole];
  });
}
