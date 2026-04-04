import { shortenAddress } from '@/lib/utils';

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
      address?: string; // Street number (e.g., "156")
    }>;

    if (!features || features.length === 0) return null;

    // Prefer POI (business/landmark) over raw address
    const poi = features.find((f) => f.place_type.includes('poi'));
    const addr = features.find((f) => f.place_type.includes('address'));
    const best = poi ?? addr ?? features[0];

    // If Mapbox found a POI, use it directly
    if (poi) {
      return {
        name: poi.text,
        address: shortenAddress(best.place_name),
        latitude,
        longitude,
      };
    }

    // No POI from Mapbox — try Google Places Nearby Search
    try {
      const nearbyRes = await fetch(
        `/api/places/nearby?latitude=${latitude}&longitude=${longitude}`,
      );
      if (nearbyRes.ok) {
        const place = await nearbyRes.json();
        if (place.name) {
          return {
            name: place.name,
            address: shortenAddress(place.address || best.place_name),
            latitude,
            longitude,
          };
        }
      }
    } catch {
      // Fall through to Mapbox address
    }

    // Build street address from number + street name (e.g., "156 Pape Avenue")
    const streetName = addr
      ? [addr.address, addr.text].filter(Boolean).join(' ')
      : best.place_name.split(',')[0];

    return {
      name: streetName,
      address: shortenAddress(best.place_name),
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}
