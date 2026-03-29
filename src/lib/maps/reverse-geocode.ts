const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface ReverseGeocodeResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Reverse-geocode coordinates using the Mapbox Geocoding API.
 * Prefers POI/business names, falls back to street address.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  if (!MAPBOX_TOKEN) return null;

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=poi,address&limit=2&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const features = data.features as Array<{
      place_type: string[];
      text: string;
      place_name: string;
    }>;

    if (!features || features.length === 0) return null;

    // Prefer POI (business/landmark) over raw address
    const poi = features.find((f) => f.place_type.includes('poi'));
    const address = features.find((f) => f.place_type.includes('address'));
    const best = poi ?? address ?? features[0];

    return {
      name: poi ? poi.text : best.place_name.split(',')[0],
      address: best.place_name,
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}
