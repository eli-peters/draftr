import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input');
  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['establishment', 'geocode'],
      }),
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error?.message ?? 'Unknown error' }, { status: 502 });
    }

    const predictions = (data.suggestions ?? [])
      .filter((s: { placePrediction?: unknown }) => s.placePrediction)
      .map(
        (s: {
          placePrediction: {
            placeId: string;
            text: { text: string };
            structuredFormat: {
              mainText: { text: string };
              secondaryText: { text: string };
            };
          };
        }) => ({
          placeId: s.placePrediction.placeId,
          description: s.placePrediction.text.text,
          mainText: s.placePrediction.structuredFormat.mainText.text,
          secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? '',
        }),
      );

    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}
