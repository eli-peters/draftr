import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const latitude = request.nextUrl.searchParams.get('latitude');
  const longitude = request.nextUrl.searchParams.get('longitude');

  if (!latitude || !longitude) {
    return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
            radius: 200,
          },
        },
        includedPrimaryTypes: [
          'park',
          'cafe',
          'coffee_shop',
          'restaurant',
          'gas_station',
          'convenience_store',
          'supermarket',
          'shopping_mall',
          'school',
          'library',
          'community_center',
          'church',
          'transit_station',
          'train_station',
          'subway_station',
          'bus_station',
          'stadium',
          'sports_club',
          'gym',
          'plaza',
          'museum',
          'art_gallery',
          'city_hall',
          'fire_station',
          'police',
          'hospital',
          'pharmacy',
          'post_office',
          'bank',
          'hotel',
          'bar',
          'bakery',
        ],
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 502 });
    }

    const place = data.places?.[0];
    if (!place) {
      return NextResponse.json({ name: null });
    }

    return NextResponse.json({
      name: place.displayName?.text ?? '',
      address: place.formattedAddress ?? '',
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to search nearby places' }, { status: 500 });
  }
}
