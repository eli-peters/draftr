import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { TOKEN_REFRESH_BUFFER_SECONDS } from '@/config/integrations';
import { refreshAccessToken as refreshStrava } from '@/lib/strava/api';
import type { IntegrationService } from '@/types/database';

/**
 * Service-specific refresh functions.
 * Each returns { access_token, refresh_token, expires_at (unix) } or null.
 */
const refreshers: Record<
  IntegrationService,
  (refreshToken: string) => Promise<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null>
> = {
  strava: refreshStrava,
  ridewithgps: async () => {
    // Stub — implemented when RWGPS keys are ready
    return null;
  },
};

/**
 * Get a valid access token for a user's connected service.
 * Transparently refreshes the token if it is near expiry.
 * Returns null if the user has no connection for the service.
 *
 * Uses the admin client to read/write tokens (bypasses RLS).
 */
export async function getValidAccessToken(
  userId: string,
  service: IntegrationService,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: connection, error } = await admin
    .from('user_connections')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .eq('service', service)
    .single();

  if (error || !connection) return null;

  const expiresAt = new Date(connection.token_expires_at).getTime() / 1000;
  const now = Date.now() / 1000;

  // Token is still valid — return it
  if (expiresAt - now > TOKEN_REFRESH_BUFFER_SECONDS) {
    return connection.access_token;
  }

  // Token needs refresh
  const refreshFn = refreshers[service];
  const refreshed = await refreshFn(connection.refresh_token);

  if (!refreshed) {
    console.error(`[integrations] Failed to refresh ${service} token for user ${userId}`);
    return null;
  }

  // Update the stored tokens
  const { error: updateError } = await admin
    .from('user_connections')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id);

  if (updateError) {
    console.error(`[integrations] Failed to persist refreshed ${service} token:`, updateError);
  }

  return refreshed.access_token;
}
