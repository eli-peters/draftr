'use client';

import { useRef, useCallback, useEffect, useState, forwardRef } from 'react';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import polyline from '@mapbox/polyline';
import 'mapbox-gl/dist/mapbox-gl.css';
import { integrations } from '@/config/integrations';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

const ROUTE_LAYER_STYLE = {
  id: 'route-line',
  type: 'line' as const,
  paint: {
    'line-color': integrations.strava.brandColor, // high contrast on both map styles
    'line-width': 3.5,
    'line-opacity': 0.85,
  },
  layout: {
    'line-cap': 'round' as const,
    'line-join': 'round' as const,
  },
};

interface RouteMapProps {
  polylineStr: string;
  routeUrl?: string | null;
  routeName?: string | null;
  className?: string;
}

export function RouteMap({ polylineStr, routeUrl, routeName, className }: RouteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Decode polyline to GeoJSON
  const decoded = polyline.toGeoJSON(polylineStr);
  const coordinates = decoded.coordinates as [number, number][];

  // Calculate bounds for auto-fit
  const bounds = coordinates.reduce(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 },
  );

  const geojson: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: decoded,
  };

  const onLoad = useCallback(() => {
    mapRef.current?.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 40, duration: 0 },
    );
  }, [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div className={className}>
      {routeUrl ? (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl"
          title={routeName ?? undefined}
        >
          <MapInner ref={mapRef} isDark={isDark} geojson={geojson} onLoad={onLoad} />
        </a>
      ) : (
        <div className="overflow-hidden rounded-xl">
          <MapInner ref={mapRef} isDark={isDark} geojson={geojson} onLoad={onLoad} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner map — separated to share between link and div wrappers
// ---------------------------------------------------------------------------

interface MapInnerProps {
  isDark: boolean;
  geojson: GeoJSON.Feature;
  onLoad: () => void;
}

const MapInner = forwardRef<MapRef, MapInnerProps>(function MapInner(
  { isDark, geojson, onLoad },
  ref,
) {
  return (
    <Map
      ref={ref}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
      style={{ width: '100%', aspectRatio: '16/9' }}
      interactive={true}
      scrollZoom={false}
      attributionControl={false}
      onLoad={onLoad}
    >
      <Source id="route" type="geojson" data={geojson}>
        <Layer {...ROUTE_LAYER_STYLE} />
      </Source>
    </Map>
  );
});
