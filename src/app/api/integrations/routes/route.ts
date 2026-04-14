import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidAccessToken } from '@/lib/integrations/tokens';
import {
  getRoutes as getStravaRoutes,
  getActivities as getStravaActivities,
} from '@/lib/strava/api';
import {
  getUserRoutes as getRwgpsRoutes,
  getUserTrips as getRwgpsTrips,
} from '@/lib/ridewithgps/api';
import type { IntegrationService, ImportableRoute } from '@/types/database';

/**
 * GET /api/integrations/routes
 *
 * Fetches routes or activities from a connected service (Strava / RWGPS).
 * Query params: service, type (routes|activities), page (1-based)
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') as IntegrationService | null;
  const type = searchParams.get('type') ?? 'routes';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  if (!service || !['strava', 'ridewithgps'].includes(service)) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  if (!['routes', 'activities'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Get a valid access token (auto-refreshes if needed)
  const token = await getValidAccessToken(user.id, service);
  if (!token) {
    return NextResponse.json(
      { error: 'Not connected or token expired', expired: true },
      { status: 404 },
    );
  }

  try {
    const perPage = 30;
    let importableRoutes: ImportableRoute[];

    if (service === 'strava') {
      importableRoutes = await fetchStravaRoutes(token, type, page, perPage);
    } else {
      // RWGPS needs the external_user_id for API calls
      const externalUserId = await getExternalUserId(user.id, service);
      if (!externalUserId) {
        return NextResponse.json({ error: 'Connection data missing' }, { status: 404 });
      }
      importableRoutes = await fetchRwgpsRoutes(token, externalUserId, type, page, perPage);
    }

    return NextResponse.json({
      routes: importableRoutes,
      hasMore: importableRoutes.length >= perPage,
    });
  } catch (error) {
    console.error(`[integrations/routes] Failed to fetch from ${service}:`, error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Strava
// ---------------------------------------------------------------------------

async function fetchStravaRoutes(
  token: string,
  type: string,
  page: number,
  perPage: number,
): Promise<ImportableRoute[]> {
  if (type === 'activities') {
    const activities = await getStravaActivities(token, page, perPage);
    if (!activities) throw new Error('Strava activities API returned null');
    return activities.map((a) => ({
      id: `strava:${a.id}`,
      service: 'strava' as const,
      name: a.name,
      description: null,
      distance_m: a.distance,
      elevation_m: a.total_elevation_gain,
      source_url: `https://www.strava.com/activities/${a.id}`,
      source_type: 'activity' as const,
      polyline: a.map?.summary_polyline ?? null,
      created_at: a.start_date_local,
    }));
  }

  const routes = await getStravaRoutes(token, page, perPage);
  if (!routes) throw new Error('Strava routes API returned null');
  return routes.map((r) => ({
    id: `strava:${r.id}`,
    service: 'strava' as const,
    name: r.name,
    description: r.description || null,
    distance_m: r.distance,
    elevation_m: r.elevation_gain,
    source_url: `https://www.strava.com/routes/${r.id}`,
    source_type: 'route' as const,
    polyline: r.map?.summary_polyline ?? null,
    created_at: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// RWGPS
// ---------------------------------------------------------------------------

async function fetchRwgpsRoutes(
  token: string,
  externalUserId: string,
  type: string,
  page: number,
  perPage: number,
): Promise<ImportableRoute[]> {
  if (type === 'activities') {
    const trips = await getRwgpsTrips(token, page, perPage);
    if (!trips) throw new Error('RWGPS trips API returned null');
    return trips.map((t) => ({
      id: `ridewithgps:${t.id}`,
      service: 'ridewithgps' as const,
      name: t.name,
      description: null,
      distance_m: t.distance,
      elevation_m: t.elevation_gain,
      source_url: `https://ridewithgps.com/trips/${t.id}`,
      source_type: 'activity' as const,
      polyline: null,
      created_at: t.departed_at || t.created_at,
    }));
  }

  const routes = await getRwgpsRoutes(token, page, perPage);
  if (!routes) throw new Error('RWGPS routes API returned null');
  return routes.map((r) => ({
    id: `ridewithgps:${r.id}`,
    service: 'ridewithgps' as const,
    name: r.name,
    description: r.description,
    distance_m: r.distance,
    elevation_m: r.elevation_gain,
    source_url: `https://ridewithgps.com/routes/${r.id}`,
    source_type: 'route' as const,
    polyline: null,
    created_at: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getExternalUserId(
  userId: string,
  service: IntegrationService,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('user_connections')
    .select('external_user_id')
    .eq('user_id', userId)
    .eq('service', service)
    .single();
  return data?.external_user_id ?? null;
}
