import 'server-only';

import { integrations } from '@/config/integrations';

/**
 * Strava API client.
 * Server-only — never import in client components.
 */

const config = integrations.strava;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  athlete: StravaAthlete;
}

export interface StravaRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // avatar URL
  profile_medium: string;
  city: string | null;
  state: string | null;
  country: string | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for access + refresh tokens.
 * Returns null on failure.
 */
export async function exchangeCodeForTokens(code: string): Promise<StravaTokenResponse | null> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      console.error('[strava] Token exchange error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as StravaTokenResponse;
  } catch (error) {
    console.error('[strava] Failed to exchange code for tokens:', error);
    return null;
  }
}

/**
 * Refresh an expired access token.
 * Returns null on failure.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<StravaRefreshResponse | null> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      console.error('[strava] Token refresh error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as StravaRefreshResponse;
  } catch (error) {
    console.error('[strava] Failed to refresh token:', error);
    return null;
  }
}

/**
 * Revoke a Strava access token (deauthorize).
 * Best-effort — does not throw on failure.
 */
export async function deauthorize(accessToken: string): Promise<void> {
  if (!config.deauthorizeUrl) return;
  try {
    await fetch(config.deauthorizeUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('[strava] Failed to deauthorize:', error);
  }
}

// ---------------------------------------------------------------------------
// Route & Activity types
// ---------------------------------------------------------------------------

export interface StravaRoute {
  id: number;
  name: string;
  description: string;
  distance: number; // meters
  elevation_gain: number; // meters
  map: { summary_polyline: string } | null;
  created_at: string;
  updated_at: string;
  type: number; // 1 = ride, 2 = run
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  total_elevation_gain: number; // meters
  type: string; // "Ride", "VirtualRide", etc.
  start_date_local: string;
  map: { summary_polyline: string } | null;
}

const CYCLING_TYPES = ['Ride', 'VirtualRide', 'GravelRide', 'EBikeRide'];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the authenticated athlete's saved routes.
 * Returns null on failure.
 */
export async function getRoutes(
  accessToken: string,
  page = 1,
  perPage = 30,
): Promise<StravaRoute[] | null> {
  try {
    const url = `${config.apiBase}/athlete/routes?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[strava] Get routes error:', res.status, await res.text());
      return null;
    }

    const routes = (await res.json()) as StravaRoute[];
    // Only return cycling routes (type 1)
    return routes.filter((r) => r.type === 1);
  } catch (error) {
    console.error('[strava] Failed to get routes:', error);
    return null;
  }
}

/**
 * Fetch the authenticated athlete's recent activities.
 * Filters to cycling types only. Returns null on failure.
 */
export async function getActivities(
  accessToken: string,
  page = 1,
  perPage = 30,
): Promise<StravaActivity[] | null> {
  try {
    const url = `${config.apiBase}/athlete/activities?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[strava] Get activities error:', res.status, await res.text());
      return null;
    }

    const activities = (await res.json()) as StravaActivity[];
    return activities.filter((a) => CYCLING_TYPES.includes(a.type));
  } catch (error) {
    console.error('[strava] Failed to get activities:', error);
    return null;
  }
}

/**
 * Fetch a single route by ID.
 * Returns null on failure.
 */
export async function getRouteById(
  accessToken: string,
  routeId: string,
): Promise<StravaRoute | null> {
  try {
    const res = await fetch(`${config.apiBase}/routes/${routeId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[strava] Get route by ID error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as StravaRoute;
  } catch (error) {
    console.error('[strava] Failed to get route by ID:', error);
    return null;
  }
}

/**
 * Fetch a single activity by ID.
 * Returns null on failure.
 */
export async function getActivityById(
  accessToken: string,
  activityId: string,
): Promise<StravaActivity | null> {
  try {
    const res = await fetch(`${config.apiBase}/activities/${activityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[strava] Get activity by ID error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as StravaActivity;
  } catch (error) {
    console.error('[strava] Failed to get activity by ID:', error);
    return null;
  }
}

/**
 * Fetch the authenticated athlete's profile.
 * Returns null on failure.
 */
export async function getAthlete(accessToken: string): Promise<StravaAthlete | null> {
  try {
    const res = await fetch(`${config.apiBase}/athlete`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[strava] Get athlete error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as StravaAthlete;
  } catch (error) {
    console.error('[strava] Failed to get athlete:', error);
    return null;
  }
}
