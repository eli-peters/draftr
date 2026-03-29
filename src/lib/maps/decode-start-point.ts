import polyline from '@mapbox/polyline';

/**
 * Decode a Google-encoded polyline and extract the first coordinate (route start).
 */
export function decodeStartPoint(encodedPolyline: string): {
  latitude: number;
  longitude: number;
} {
  const decoded = polyline.toGeoJSON(encodedPolyline);
  const [lng, lat] = decoded.coordinates[0] as [number, number];
  return { latitude: lat, longitude: lng };
}
