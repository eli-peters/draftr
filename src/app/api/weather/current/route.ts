import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentWeather } from '@/lib/weather/api';

/**
 * Current weather API route — called by the client-side CurrentWeather component.
 * Accepts lat/lon from the user's browser geolocation.
 *
 * GET /api/weather/current?lat=43.65&lon=-79.35
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Missing or invalid lat/lon parameters' }, { status: 400 });
  }

  // Round to 2 decimal places (~1.1 km precision) so nearby users share cache
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  const weather = await fetchCurrentWeather(roundedLat, roundedLon);

  if (!weather) {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 });
  }

  return NextResponse.json(weather, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
