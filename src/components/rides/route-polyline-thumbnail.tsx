'use client';

import { memo, useMemo } from 'react';
import { MapTrifold } from '@phosphor-icons/react/dist/ssr';
import polyline from '@mapbox/polyline';
import { cn } from '@/lib/utils';

interface RoutePolylineThumbnailProps {
  encodedPolyline: string | null;
  className?: string;
}

/** Decode + normalize a polyline to SVG-friendly 0–100 coordinates. */
function decodeAndNormalize(encoded: string): string {
  const decoded = polyline.decode(encoded);
  if (decoded.length < 2) return '';

  // Extract lat/lng bounds
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  for (const [lat, lng] of decoded) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const padding = 10; // 10% padding on each side
  const usable = 100 - padding * 2;

  // Normalize to 0–100 viewBox, flipping Y (lat increases up, SVG y increases down)
  return decoded
    .map(([lat, lng]) => {
      const x = padding + ((lng - minLng) / lngRange) * usable;
      const y = padding + ((maxLat - lat) / latRange) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export const RoutePolylineThumbnail = memo(function RoutePolylineThumbnail({
  encodedPolyline,
  className,
}: RoutePolylineThumbnailProps) {
  const points = useMemo(
    () => (encodedPolyline ? decodeAndNormalize(encodedPolyline) : null),
    [encodedPolyline],
  );

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted',
        className,
      )}
    >
      {points ? (
        <svg viewBox="0 0 100 100" className="size-full p-1" preserveAspectRatio="xMidYMid meet">
          <polyline
            points={points}
            fill="none"
            className="stroke-text-tertiary"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <MapTrifold weight="duotone" className="size-5 text-muted-foreground" />
      )}
    </div>
  );
});
