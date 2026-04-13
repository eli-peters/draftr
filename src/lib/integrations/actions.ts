'use server';

import { cookies } from 'next/headers';
import { getUser } from '@/lib/supabase/server';
import { invalidateProfile } from '@/lib/cache-tags';
import { createAdminClient } from '@/lib/supabase/admin';
import { integrations, OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE } from '@/config/integrations';
import { deauthorize as stravaDeauthorize } from '@/lib/strava/api';
import { deauthorize as rwgpsDeauthorize } from '@/lib/ridewithgps/api';
import { appContent } from '@/content/app';
import { settingsContent } from '@/content/settings';
import type { IntegrationService } from '@/types/database';

const { common } = appContent;
const content = settingsContent.connections;

/**
 * Initiate OAuth connection for a service.
 * Sets a CSRF state cookie and returns the authorization URL.
 */
export async function initiateConnect(service: IntegrationService) {
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const config = integrations[service];
  if (!config) return { error: `Unknown service: ${service}` };

  // Generate CSRF state
  const state = crypto.randomUUID();

  // Store state in cookie for validation in callback
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, service }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE,
    path: '/',
  });

  // Build authorize URL
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${siteUrl}${config.callbackPath}`;

  const params = new URLSearchParams({
    client_id: process.env[config.clientIdEnvKey] ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes,
    state,
  });

  return { redirectUrl: `${config.authorizeUrl}?${params.toString()}` };
}

/**
 * Disconnect a service — revoke token and delete connection.
 */
export async function disconnectService(service: IntegrationService) {
  const user = await getUser();
  if (!user) return { error: common.notAuthenticated };

  const admin = createAdminClient();

  // Fetch the connection to get the access token for revocation
  const { data: connection, error: fetchError } = await admin
    .from('user_connections')
    .select('id, access_token, service')
    .eq('user_id', user.id)
    .eq('service', service)
    .single();

  if (fetchError || !connection) {
    return { error: content.disconnectError(integrations[service]?.displayName ?? service) };
  }

  // Revoke token on the provider side (best-effort)
  if (service === 'strava') {
    await stravaDeauthorize(connection.access_token);
  } else if (service === 'ridewithgps') {
    await rwgpsDeauthorize(connection.access_token);
  }

  // Delete the connection
  const { error: deleteError } = await admin
    .from('user_connections')
    .delete()
    .eq('id', connection.id);

  if (deleteError) {
    return { error: content.disconnectError(integrations[service]?.displayName ?? service) };
  }

  invalidateProfile(user.id);
  return { success: true };
}
