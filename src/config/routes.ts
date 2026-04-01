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
