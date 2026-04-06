import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens } from '@/lib/strava/api';
import { integrations, OAUTH_STATE_COOKIE } from '@/config/integrations';
import { routes } from '@/config/routes';

/**
 * Strava OAuth callback handler.
 * Validates CSRF state, exchanges code for tokens, stores the connection.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const stravaError = searchParams.get('error');

  const errorRedirect = `${origin}${routes.settings}?integration=strava&status=error`;
  const successRedirect = `${origin}${routes.settings}?integration=strava&status=connected`;

  // User denied access on Strava
  if (stravaError) {
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

  // Delete the state cookie regardless of outcome
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (storedState.state !== state || storedState.service !== 'strava') {
    return NextResponse.redirect(errorRedirect);
  }

  // Verify the user is authenticated
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}${routes.signIn}`);
  }

  // Exchange code for tokens
  const tokenData = await exchangeCodeForTokens(code);
  if (!tokenData) {
    return NextResponse.redirect(errorRedirect);
  }

  // Store the connection via admin client (bypasses RLS)
  const admin = createAdminClient();
  const { error: upsertError } = await admin.from('user_connections').upsert(
    {
      user_id: user.id,
      service: 'strava',
      external_user_id: String(tokenData.athlete.id),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
      scope: integrations.strava.scopes,
      profile_data: tokenData.athlete,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,service' },
  );

  if (upsertError) {
    console.error('[strava] Failed to store connection:', upsertError);
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(successRedirect);
}
