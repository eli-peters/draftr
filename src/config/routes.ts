/**
 * Top-level routes show bottom nav + logo header on mobile.
 * Any route NOT in this set is a "child" route (back arrow header, no bottom nav).
 */
const topLevelRoutes = new Set(['/', '/rides', '/manage']);

/**
 * Routes that can serve as a back-navigation target for deeper children,
 * but are themselves children of a top-level route.
 */
const intermediateRoutes = new Set([
  '/manage/rides',
  '/manage/members',
  '/manage/announcements',
  '/manage/settings',
]);

/** Returns true if the given pathname is a child route (not a top-level tab). */
export function isChildRoute(pathname: string): boolean {
  return !topLevelRoutes.has(pathname);
}

/** Returns the nearest navigable ancestor for a given child pathname. */
export function getParentRoute(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 0) {
    segments.pop();
    const candidate = segments.length === 0 ? '/' : `/${segments.join('/')}`;
    if (topLevelRoutes.has(candidate) || intermediateRoutes.has(candidate)) return candidate;
  }
  return '/';
}

export const routes = {
  home: '/',
  signIn: '/sign-in',
  setupProfile: '/setup-profile',
  rides: '/rides',
  ride: (id: string) => `/rides/${id}`,
  manage: '/manage',
  manageRides: '/manage/rides',
  manageMembers: '/manage/members',
  manageAnnouncements: '/manage/announcements',
  manageSettings: '/manage/settings',
  manageNewRide: '/manage/rides/new',
  manageEditRide: (id: string, returnTo?: string) =>
    returnTo
      ? `/manage/rides/${id}/edit?returnTo=${encodeURIComponent(returnTo)}`
      : `/manage/rides/${id}/edit`,
  manageTab: (tab: string) => `/manage/rides?tab=${tab}`,
  profile: '/profile',
  profileHistory: '/profile/history',
  publicProfile: (userId: string) => `/profile/${userId}`,
  settings: '/settings',
  notifications: '/notifications',
  stravaCallback: '/api/integrations/strava/callback',
  rwgpsCallback: '/api/integrations/ridewithgps/callback',
  importRoutes: '/api/integrations/routes',
  importRouteById: (id: string) => `/api/integrations/routes/${id}`,
  scrapeRoute: '/api/integrations/routes/scrape',
  placesAutocomplete: '/api/places/autocomplete',
  placesDetails: '/api/places/details',
} as const;

/**
 * Resolve the current site's base URL.
 *
 * Prefers NEXT_PUBLIC_APP_URL (prod) → VERCEL_BRANCH_URL (stable per-branch
 * preview URL) → VERCEL_URL (per-deployment URL) → localhost (dev). The Vercel
 * vars are auto-injected on Vercel builds, so preview deployments self-configure
 * without needing a per-project NEXT_PUBLIC_APP_URL.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_BRANCH_URL) return `https://${process.env.VERCEL_BRANCH_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Build a full URL on the app subdomain (go.draftr.app in production).
 * Use for cross-subdomain links from marketing → app.
 */
export function appUrl(path: string): string {
  return `${getSiteUrl()}${path}`;
}

/**
 * Build a full URL on the marketing root domain (draftr.app in production).
 * Use for cross-subdomain links from app → marketing.
 */
export function marketingUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000';
  return `${base}${path}`;
}
