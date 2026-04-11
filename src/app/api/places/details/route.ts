import { NextResponse, type NextRequest } from 'next/server';
import { shortenAddress } from '@/lib/utils';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId');
  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location',
      },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error?.message ?? 'Unknown error' }, { status: 502 });
    }

    return NextResponse.json({
      name: data.displayName?.text ?? '',
      address: shortenAddress(data.formattedAddress ?? ''),
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 });
  }
}
