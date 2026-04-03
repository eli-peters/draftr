/**
 * Parent routes show bottom nav + logo header on mobile.
 * Any route NOT in this set is a "child" route (back arrow header, no bottom nav).
 */
const parentRoutes = new Set(['/', '/rides', '/my-rides', '/manage', '/notifications']);

/** Returns true if the given pathname is a child route (not a top-level tab). */
export function isChildRoute(pathname: string): boolean {
  return !parentRoutes.has(pathname);
}

/** Returns the parent route for a given child pathname. */
export function getParentRoute(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return '/';
  const candidate = `/${segments[0]}`;
  return parentRoutes.has(candidate) ? candidate : '/';
}

export const routes = {
  home: '/',
  signIn: '/sign-in',
  setupProfile: '/setup-profile',
  rides: '/rides',
  ride: (id: string) => `/rides/${id}`,
  schedule: '/my-rides',
  manage: '/manage',
  manageNewRide: '/manage/rides/new',
  manageEditRide: (id: string, returnTo?: string) =>
    returnTo
      ? `/manage/rides/${id}/edit?returnTo=${encodeURIComponent(returnTo)}`
      : `/manage/rides/${id}/edit`,
  manageTab: (tab: string) => `/manage?tab=${tab}`,
  profile: '/profile',
  publicProfile: (userId: string) => `/profile/${userId}`,
  notifications: '/notifications',
  stravaCallback: '/api/integrations/strava/callback',
  rwgpsCallback: '/api/integrations/ridewithgps/callback',
  importRoutes: '/api/integrations/routes',
  importRouteById: (id: string) => `/api/integrations/routes/${id}`,
  scrapeRoute: '/api/integrations/routes/scrape',
  placesAutocomplete: '/api/places/autocomplete',
  placesDetails: '/api/places/details',
} as const;
