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
  try {
    await fetch(config.deauthorizeUrl!, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error('[strava] Failed to deauthorize:', error);
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
