import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/integrations/tokens';
import {
  getRouteById as getStravaRoute,
  getActivityById as getStravaActivity,
} from '@/lib/strava/api';
import {
  getRouteById as getRwgpsRoute,
  getTripById as getRwgpsTrip,
  getRoutePolyline as getRwgpsRoutePolyline,
  getTripPolyline as getRwgpsTripPolyline,
} from '@/lib/ridewithgps/api';
import type { IntegrationService, ImportableRoute } from '@/types/database';

/**
 * GET /api/integrations/routes/[id]
 *
 * Fetches a single route/activity by service + resource ID.
 * Query params: service (strava|ridewithgps), type (route|activity|trip)
 *
 * Used by the ride form when a leader pastes a Strava/RWGPS URL
 * and has a connected account for that service.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: resourceId } = await params;
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') as IntegrationService | null;
  const type = searchParams.get('type') ?? 'route';

  if (!service || !['strava', 'ridewithgps'].includes(service)) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  if (!['route', 'activity', 'trip'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const token = await getValidAccessToken(user.id, service);
  if (!token) {
    return NextResponse.json(
      { error: 'Not connected or token expired', expired: true },
      { status: 404 },
    );
  }

  try {
    let importable: ImportableRoute | null = null;

    if (service === 'strava') {
      importable = await fetchStravaResource(token, resourceId, type);
    } else {
      importable = await fetchRwgpsResource(token, resourceId, type);
    }

    if (!importable) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({ route: importable });
  } catch (error) {
    console.error(`[integrations/routes/${resourceId}] Failed to fetch from ${service}:`, error);
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 502 });
  }
}

async function fetchStravaResource(
  token: string,
  id: string,
  type: string,
): Promise<ImportableRoute | null> {
  if (type === 'activity') {
    const activity = await getStravaActivity(token, id);
    if (!activity) return null;
    return {
      id: `strava:${activity.id}`,
      service: 'strava',
      name: activity.name,
      description: null,
      distance_m: activity.distance,
      elevation_m: activity.total_elevation_gain,
      source_url: `https://www.strava.com/activities/${activity.id}`,
      source_type: 'activity',
      polyline: activity.map?.summary_polyline ?? null,
      created_at: activity.start_date_local,
    };
  }

  const route = await getStravaRoute(token, id);
  if (!route) return null;
  return {
    id: `strava:${route.id}`,
    service: 'strava',
    name: route.name,
    description: route.description || null,
    distance_m: route.distance,
    elevation_m: route.elevation_gain,
    source_url: `https://www.strava.com/routes/${route.id}`,
    source_type: 'route',
    polyline: route.map?.summary_polyline ?? null,
    created_at: route.created_at,
  };
}

async function fetchRwgpsResource(
  token: string,
  id: string,
  type: string,
): Promise<ImportableRoute | null> {
  if (type === 'trip') {
    const [trip, polyline] = await Promise.all([
      getRwgpsTrip(token, id),
      getRwgpsTripPolyline(token, id),
    ]);
    if (!trip) return null;
    return {
      id: `ridewithgps:${trip.id}`,
      service: 'ridewithgps',
      name: trip.name,
      description: null,
      distance_m: trip.distance,
      elevation_m: trip.elevation_gain,
      source_url: `https://ridewithgps.com/trips/${trip.id}`,
      source_type: 'activity',
      polyline,
      created_at: trip.departed_at || trip.created_at,
    };
  }

  const [route, polyline] = await Promise.all([
    getRwgpsRoute(token, id),
    getRwgpsRoutePolyline(token, id),
  ]);
  if (!route) return null;
  return {
    id: `ridewithgps:${route.id}`,
    service: 'ridewithgps',
    name: route.name,
    description: route.description,
    distance_m: route.distance,
    elevation_m: route.elevation_gain,
    source_url: `https://ridewithgps.com/routes/${route.id}`,
    source_type: 'route',
    polyline,
    created_at: route.created_at,
  };
}
