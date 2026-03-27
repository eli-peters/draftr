/**
 * Build a platform-appropriate directions URL for a meeting location.
 * Returns null if no usable location data is available.
 */
export function buildDirectionsUrl({
  latitude,
  longitude,
  address,
  name,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  name: string | null;
}): string | null {
  // Prefer coordinates for accuracy
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  // Fall back to address string
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  // Fall back to location name as search query
  if (name) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}`;
  }

  return null;
}
