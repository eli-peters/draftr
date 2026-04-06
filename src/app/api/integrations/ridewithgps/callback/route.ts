import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens, getCurrentUser } from '@/lib/ridewithgps/api';
import { integrations, OAUTH_STATE_COOKIE } from '@/config/integrations';
import { routes } from '@/config/routes';

const SERVICE = 'ridewithgps';

/**
 * RideWithGPS OAuth callback handler.
 * Validates CSRF state, exchanges code for token, fetches profile, stores connection.
 *
 * RWGPS tokens do not expire via a standard expires_at field.
 * We set a far-future expiry so the generic token refresh logic skips refresh attempts.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  const errorRedirect = `${origin}${routes.settings}?integration=${SERVICE}&status=error`;
  const successRedirect = `${origin}${routes.settings}?integration=${SERVICE}&status=connected`;

  // User denied access
  if (oauthError) {
    return NextResponse.redirect(errorRedirect);
  }

  if (!code || !state) {
    return NextResponse.redirect(errorRedirect);
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE);

  if (!stateCookie?.value) {
    return NextResponse.redirect(errorRedirect);
  }

  let storedState: { state: string; service: string };
  try {
    storedState = JSON.parse(stateCookie.value);
  } catch {
    return NextResponse.redirect(errorRedirect);
  }

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (storedState.state !== state || storedState.service !== SERVICE) {
    return NextResponse.redirect(errorRedirect);
  }

  // Verify the user is authenticated
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}${routes.signIn}`);
  }

  // Exchange code for token — RWGPS requires redirect_uri in token exchange
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const redirectUri = `${siteUrl}${integrations.ridewithgps.callbackPath}`;
  const tokenData = await exchangeCodeForTokens(code, redirectUri);
  if (!tokenData) {
    return NextResponse.redirect(errorRedirect);
  }

  // Fetch user profile for display info
  const rwgpsUser = await getCurrentUser(tokenData.access_token);

  // RWGPS tokens don't have an explicit expiry or refresh tokens.
  // Set a far-future expiry (10 years) so the generic refresh logic never triggers.
  const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
  const farFutureExpiry = new Date(Date.now() + TEN_YEARS_MS).toISOString();

  // Store the connection via admin client (bypasses RLS)
  const admin = createAdminClient();
  const { error: upsertError } = await admin.from('user_connections').upsert(
    {
      user_id: user.id,
      service: SERVICE,
      external_user_id: String(tokenData.user_id),
      access_token: tokenData.access_token,
      refresh_token: '', // RWGPS does not issue refresh tokens
      token_expires_at: farFutureExpiry,
      scope: tokenData.scope,
      profile_data: rwgpsUser,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,service' },
  );

  if (upsertError) {
    console.error('[rwgps] Failed to store connection:', upsertError);
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(successRedirect);
}
