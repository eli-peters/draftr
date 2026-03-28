import type { IntegrationService } from '@/types/database';

export interface ParsedRouteUrl {
  service: IntegrationService;
  type: 'route' | 'activity' | 'trip';
  id: string;
}

/**
 * Parse a Strava or RideWithGPS URL into its service, resource type, and ID.
 * Returns null if the URL is not recognized.
 */
export function parseRouteUrl(url: string): ParsedRouteUrl | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);

  // strava.com/routes/{id} or strava.com/activities/{id}
  if (host === 'strava.com') {
    if (segments.length >= 2) {
      const [resource, id] = segments;
      if (resource === 'routes' && /^\d+$/.test(id)) {
        return { service: 'strava', type: 'route', id };
      }
      if (resource === 'activities' && /^\d+$/.test(id)) {
        return { service: 'strava', type: 'activity', id };
      }
    }
    return null;
  }

  // ridewithgps.com/routes/{id} or ridewithgps.com/trips/{id}
  if (host === 'ridewithgps.com') {
    if (segments.length >= 2) {
      const [resource, id] = segments;
      if (resource === 'routes' && /^\d+$/.test(id)) {
        return { service: 'ridewithgps', type: 'route', id };
      }
      if (resource === 'trips' && /^\d+$/.test(id)) {
        return { service: 'ridewithgps', type: 'trip', id };
      }
    }
    return null;
  }

  return null;
}
