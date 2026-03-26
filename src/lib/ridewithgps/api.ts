import 'server-only';

import { integrations } from '@/config/integrations';

/**
 * RideWithGPS API client.
 * Server-only — never import in client components.
 *
 * RWGPS does NOT issue refresh tokens. When a token expires,
 * the user must re-authenticate via OAuth.
 */

const config = integrations.ridewithgps;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface RwgpsTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
  user_id: number;
}

export interface RwgpsUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Exchange an authorization code for an access token.
 * Returns null on failure.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<RwgpsTokenResponse | null> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.RWGPS_CLIENT_ID,
        client_secret: process.env.RWGPS_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      console.error('[rwgps] Token exchange error:', res.status, await res.text());
      return null;
    }

    return (await res.json()) as RwgpsTokenResponse;
  } catch (error) {
    console.error('[rwgps] Failed to exchange code for tokens:', error);
    return null;
  }
}

/**
 * Revoke an access token.
 * Best-effort — does not throw on failure.
 */
export async function deauthorize(accessToken: string): Promise<void> {
  if (!config.deauthorizeUrl) return;
  try {
    await fetch(config.deauthorizeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.RWGPS_CLIENT_ID,
        client_secret: process.env.RWGPS_CLIENT_SECRET,
        token: accessToken,
      }),
    });
  } catch (error) {
    console.error('[rwgps] Failed to deauthorize:', error);
  }
}

// ---------------------------------------------------------------------------
// Route & Trip types
// ---------------------------------------------------------------------------

export interface RwgpsRoute {
  id: number;
  name: string;
  description: string | null;
  distance: number; // meters
  elevation_gain: number; // meters
  created_at: string;
  updated_at: string;
}

export interface RwgpsTrip {
  id: number;
  name: string;
  distance: number; // meters
  elevation_gain: number; // meters
  created_at: string;
  departed_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build RWGPS API URL with auth token as query parameter.
 * RWGPS v1 API accepts auth_token + apikey as query params (legacy)
 * or x-rwgps-api-key + x-rwgps-auth-token headers.
 * Using query params as fallback since header auth returns 401.
 */
function authenticatedUrl(path: string, accessToken: string, extraParams = '') {
  const sep = path.includes('?') ? '&' : '?';
  const apiKey = process.env.RWGPS_CLIENT_ID;
  if (!apiKey) throw new Error('RWGPS_CLIENT_ID environment variable is not set');
  return `${config.apiBase}${path}${sep}auth_token=${accessToken}&apikey=${apiKey}${extraParams ? '&' + extraParams : ''}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the authenticated user's routes.
 * Uses RWGPS v1 pagination (page + page_size). Returns null on failure.
 */
export async function getUserRoutes(
  accessToken: string,
  _userId: string,
  page = 1,
  pageSize = 30,
): Promise<RwgpsRoute[] | null> {
  try {
    const url = authenticatedUrl('/routes.json', accessToken, `page=${page}&page_size=${pageSize}`);
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[rwgps] Get routes error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return (data.routes ?? []) as RwgpsRoute[];
  } catch (error) {
    console.error('[rwgps] Failed to get routes:', error);
    return null;
  }
}

/**
 * Fetch the authenticated user's recorded trips (activities).
 * Uses RWGPS v1 pagination (page + page_size). Returns null on failure.
 */
export async function getUserTrips(
  accessToken: string,
  _userId: string,
  page = 1,
  pageSize = 30,
): Promise<RwgpsTrip[] | null> {
  try {
    const url = authenticatedUrl('/trips.json', accessToken, `page=${page}&page_size=${pageSize}`);
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[rwgps] Get trips error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return (data.trips ?? []) as RwgpsTrip[];
  } catch (error) {
    console.error('[rwgps] Failed to get trips:', error);
    return null;
  }
}

/**
 * Fetch the authenticated user's profile.
 * Returns null on failure.
 */
export async function getCurrentUser(accessToken: string): Promise<RwgpsUser | null> {
  try {
    const res = await fetch(authenticatedUrl('/users/current.json', accessToken));

    if (!res.ok) {
      console.error('[rwgps] Get current user error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return (data.user ?? data) as RwgpsUser;
  } catch (error) {
    console.error('[rwgps] Failed to get current user:', error);
    return null;
  }
}
