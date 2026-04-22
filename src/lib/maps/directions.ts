import type { MapsPlatform } from './platform';

interface DirectionsInput {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  name: string | null;
  platform?: MapsPlatform;
}

/**
 * Build a platform-appropriate directions URL for a meeting location.
 *
 * - iOS → Apple Maps (`https://maps.apple.com/?daddr=…`) — opens the system
 *   maps app natively; Safari honours the scheme as a universal link.
 * - Android → `geo:` URI — opens the user's default maps app (Google Maps,
 *   Waze, OsmAnd, etc.) via the system intent chooser.
 * - Web / unknown → Google Maps directions URL.
 *
 * Returns null if no usable location data is available.
 */
export function buildDirectionsUrl({
  latitude,
  longitude,
  address,
  name,
  platform = 'web',
}: DirectionsInput): string | null {
  if (platform === 'ios') return buildAppleMapsUrl({ latitude, longitude, address, name });
  if (platform === 'android') return buildGeoUri({ latitude, longitude, address, name });
  return buildGoogleMapsUrl({ latitude, longitude, address, name });
}

function buildAppleMapsUrl({
  latitude,
  longitude,
  address,
  name,
}: Omit<DirectionsInput, 'platform'>): string | null {
  if (latitude != null && longitude != null) {
    return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  if (address) return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
  if (name) return `https://maps.apple.com/?daddr=${encodeURIComponent(name)}`;
  return null;
}

function buildGeoUri({
  latitude,
  longitude,
  address,
  name,
}: Omit<DirectionsInput, 'platform'>): string | null {
  if (latitude != null && longitude != null) {
    const label = name ? `(${encodeURIComponent(name)})` : '';
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}${label}`;
  }
  const query = address ?? name;
  if (query) return `geo:0,0?q=${encodeURIComponent(query)}`;
  return null;
}

function buildGoogleMapsUrl({
  latitude,
  longitude,
  address,
  name,
}: Omit<DirectionsInput, 'platform'>): string | null {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  if (address)
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  if (name) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}`;
  return null;
}
