import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
import type { ImportableRoute } from '@/types/database';

/**
 * GET /api/integrations/routes/scrape?url=<encoded-url>
 *
 * Scrapes public route metadata (name, distance, elevation) from a
 * Strava or RideWithGPS page without requiring an API connection.
 * Returns a partial ImportableRoute (no polyline).
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const parsed = parseRouteUrl(url);

  try {
    let route: ImportableRoute | null = null;

    if (parsed?.service === 'strava') {
      route = await scrapeStrava(parsed.id, url);
    } else if (parsed?.service === 'ridewithgps') {
      route = await scrapeRwgps(parsed.id, url, parsed.type as 'route' | 'trip');
    } else {
      route = await scrapeGeneric(url);
    }

    if (!route) {
      return NextResponse.json({ error: 'Could not extract route data' }, { status: 422 });
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error('[routes/scrape] Failed to scrape:', error);
    return NextResponse.json({ error: 'Failed to scrape route' }, { status: 502 });
  }
}

/**
 * Scrape Strava public route page via HTML.
 * Title format: "Route Name | 78.68 km Cycling Route on Strava"
 */
async function scrapeStrava(id: string, sourceUrl: string): Promise<ImportableRoute | null> {
  const res = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Draftr/1.0)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) return null;

  const title = decodeHtmlEntities(titleMatch[1].trim());

  // Title format: "Route Name | 78.68 km Cycling Route on Strava"
  const stravaSuffix = /\s*\|\s*([\d.,]+)\s*(km|mi)\s+\w+\s+Route on Strava\s*$/i;
  const suffixMatch = title.match(stravaSuffix);

  let name = title;
  let distanceKm: number | null = null;

  if (suffixMatch) {
    name = title.slice(0, suffixMatch.index).trim();
    const distVal = parseFloat(suffixMatch[1].replace(',', ''));
    const unit = suffixMatch[2].toLowerCase();
    distanceKm = unit === 'mi' ? distVal * 1.60934 : distVal;
  }

  // Scrape elevation from body — look for patterns near "elevation" keyword
  const elevationM = scrapeElevation(html);

  // Scrape distance from body if not found in title
  if (distanceKm === null) {
    distanceKm = scrapeDistance(html);
  }

  return {
    id: `strava:${id}`,
    service: 'strava',
    name,
    description: null,
    distance_m: distanceKm ? Math.round(distanceKm * 1000) : 0,
    elevation_m: elevationM ?? 0,
    source_url: sourceUrl,
    source_type: 'route',
    polyline: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Fetch RideWithGPS route/trip data via their public JSON endpoint.
 * RWGPS is a client-side SPA so HTML scraping doesn't work — but
 * appending .json to any route/trip URL returns structured data.
 */
async function scrapeRwgps(
  id: string,
  sourceUrl: string,
  type: 'route' | 'trip',
): Promise<ImportableRoute | null> {
  const jsonUrl = `https://ridewithgps.com/${type === 'trip' ? 'trips' : 'routes'}/${id}.json`;

  const res = await fetch(jsonUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (!data?.name) return null;

  return {
    id: `ridewithgps:${id}`,
    service: 'ridewithgps',
    name: data.name,
    description: data.description || null,
    distance_m: Math.round(data.distance ?? 0),
    elevation_m: Math.round(data.elevation_gain ?? 0),
    source_url: sourceUrl,
    source_type: type === 'trip' ? 'activity' : 'route',
    polyline: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Generic scraper for any public route page (Komoot, Garmin, MapMyRide, etc).
 * Tries JSON-LD structured data first, falls back to og:title and HTML scraping.
 */
async function scrapeGeneric(sourceUrl: string): Promise<ImportableRoute | null> {
  const res = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Draftr/1.0)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const html = await res.text();

  // Try JSON-LD structured data first (Komoot, AllTrails, etc.)
  const jsonLd = extractJsonLd(html);

  let name: string | null = null;
  let description: string | null = null;
  let distanceKm: number | null = null;
  let elevationM: number | null = null;
  let startLatitude: number | null = null;
  let startLongitude: number | null = null;

  if (jsonLd) {
    name = (jsonLd.name as string) ?? null;
    description = (jsonLd.description as string) ?? null;

    // Parse distance from additionalProperty (e.g. "13.3 km")
    const props = jsonLd.additionalProperty as { name?: string; value?: string }[] | undefined;
    if (Array.isArray(props)) {
      const distProp = props.find((p) => p.name === 'Distance');
      if (distProp?.value) {
        const match = distProp.value.match(/([\d.,]+)\s*(km|mi)/i);
        if (match) {
          const val = parseFloat(match[1].replace(',', ''));
          distanceKm = match[2].toLowerCase() === 'mi' ? val * 1.60934 : val;
        }
      }
      const elevProp = props.find((p) => p.name === 'Elevation' || p.name === 'Ascent');
      if (elevProp?.value) {
        const match = elevProp.value.match(/([\d.,]+)\s*(m|ft)/i);
        if (match) {
          const val = parseFloat(match[1].replace(',', ''));
          elevationM = match[2].toLowerCase() === 'ft' ? Math.round(val * 0.3048) : Math.round(val);
        }
      }
    }

    // Extract start point from itinerary (first item with geo coordinates)
    const itinerary = jsonLd.itinerary as
      | { itemListElement?: { item?: { geo?: { latitude?: number; longitude?: number } } }[] }
      | undefined;
    if (itinerary?.itemListElement?.length) {
      const firstGeo = itinerary.itemListElement[0]?.item?.geo;
      if (firstGeo?.latitude && firstGeo?.longitude) {
        startLatitude = firstGeo.latitude;
        startLongitude = firstGeo.longitude;
      }
    }
  }

  // Fallback to HTML scraping for name
  if (!name) {
    const ogTitleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawName = ogTitleMatch?.[1] ?? titleMatch?.[1];
    if (!rawName) return null;
    name = decodeHtmlEntities(rawName.trim());
  }

  // Fallback to HTML scraping for distance/elevation
  if (distanceKm === null) distanceKm = scrapeDistance(html);
  if (elevationM === null) elevationM = scrapeElevation(html);

  const urlHash = sourceUrl.replace(/[^a-zA-Z0-9]/g, '').slice(-12);

  return {
    id: `external:${urlHash}`,
    service: 'strava', // placeholder — satisfies type constraint
    name,
    description,
    distance_m: distanceKm ? Math.round(distanceKm * 1000) : 0,
    elevation_m: elevationM ?? 0,
    source_url: sourceUrl,
    source_type: 'route',
    polyline: null,
    start_latitude: startLatitude,
    start_longitude: startLongitude,
    created_at: new Date().toISOString(),
  };
}

/**
 * Extract the most relevant JSON-LD block from HTML (Trip, ExerciseAction, or first with a name).
 */
function extractJsonLd(html: string): Record<string, unknown> | null {
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (!blocks) return null;

  let best: Record<string, unknown> | null = null;

  for (const block of blocks) {
    const jsonStr = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      const parsed = JSON.parse(jsonStr);
      const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']];
      // Prefer Trip/ExerciseAction types (Komoot uses Trip)
      if (types.some((t: string) => ['Trip', 'ExerciseAction', 'SportsEvent'].includes(t))) {
        return parsed;
      }
      if (parsed.name && !best) {
        best = parsed;
      }
    } catch {
      // Invalid JSON-LD block
    }
  }

  return best;
}

/**
 * Scrape distance value from HTML body text.
 */
function scrapeDistance(html: string): number | null {
  const patterns = [/([\d.,]+)\s*km/gi, /([\d.,]+)\s*mi/gi];

  for (const pattern of patterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const val = parseFloat(match[1].replace(',', ''));
      if (val > 0 && val < 1000) {
        const isMiles = match[0].toLowerCase().includes('mi');
        return isMiles ? val * 1.60934 : val;
      }
    }
  }

  return null;
}

/**
 * Scrape elevation value from HTML body text.
 */
function scrapeElevation(html: string): number | null {
  const contextPatterns = [
    /elevat\w*[^<]{0,30}?([\d.,]+)\s*(?:m|meters?)(?:\b|[<\s])/gi,
    /elevat\w*[^<]{0,30}?([\d.,]+)\s*(?:ft|feet)(?:\b|[<\s])/gi,
  ];

  for (const pattern of contextPatterns) {
    const match = pattern.exec(html);
    if (match) {
      const val = parseFloat(match[1].replace(',', ''));
      if (val >= 0 && val < 20000) {
        const isFeet = /ft|feet/i.test(match[0]);
        return Math.round(isFeet ? val * 0.3048 : val);
      }
    }
  }

  // Fallback: standalone values in plausible elevation range
  const fallbackPatterns = [/([\d.,]+)\s*m\b/gi, /([\d.,]+)\s*ft\b/gi];

  for (const pattern of fallbackPatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const val = parseFloat(match[1].replace(',', ''));
      if (val >= 10 && val < 10000) {
        const isFeet = match[0].includes('ft');
        return Math.round(isFeet ? val * 0.3048 : val);
      }
    }
  }

  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
