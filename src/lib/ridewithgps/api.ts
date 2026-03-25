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
  try {
    await fetch(config.deauthorizeUrl!, {
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

/**
 * Fetch the authenticated user's profile.
 * Returns null on failure.
 */
export async function getCurrentUser(accessToken: string): Promise<RwgpsUser | null> {
  try {
    const res = await fetch(`${config.apiBase}/users/current.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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
