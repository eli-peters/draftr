'use client';

import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import polyline from '@mapbox/polyline';
import './map-styles';
import { integrations } from '@/config/integrations';
import { useMapBackdropMetrics } from './map-backdrop-context';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

const ROUTE_LAYER_STYLE = {
  id: 'route-line',
  type: 'line' as const,
  paint: {
    'line-color': integrations.strava.brandColor,
    'line-width': 4,
    'line-opacity': 0.9,
  },
  layout: {
    'line-cap': 'round' as const,
    'line-join': 'round' as const,
  },
};

interface RouteMapBackdropProps {
  polylineStr?: string | null;
  routeUrl?: string | null;
  className?: string;
}

export function RouteMapBackdrop({ polylineStr, routeUrl, className }: RouteMapBackdropProps) {
  if (!polylineStr || !MAPBOX_TOKEN) {
    return <div className={cn('absolute inset-0 bg-muted', className)} aria-hidden />;
  }

  return (
    <div className={cn('absolute inset-0', className)}>
      <MapInner polylineStr={polylineStr} routeUrl={routeUrl} />
    </div>
  );
}

// ---------------------------------------------------------------------------

interface MapInnerProps {
  polylineStr: string;
  routeUrl?: string | null;
}

const EDGE_PADDING_PX = 16;
const TOP_PADDING_PX = 56;

function MapInner({ polylineStr, routeUrl }: MapInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const metrics = useMapBackdropMetrics();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { geojson, bounds } = useMemo(() => {
    const decoded = polyline.toGeoJSON(polylineStr);
    const coordinates = decoded.coordinates as [number, number][];
    const extent = coordinates.reduce(
      (acc, [lng, lat]) => ({
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
        sumLng: acc.sumLng + lng,
        sumLat: acc.sumLat + lat,
      }),
      { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90, sumLng: 0, sumLat: 0 },
    );
    // Symmetrise the bounds around the polyline centroid so fitBounds centres
    // the *visual* mass of the route (not the geometric bbox midpoint — those
    // differ when points are unevenly distributed, e.g. a route with dense
    // loops at one end and a sparse out-and-back at the other).
    const centroidLng = extent.sumLng / coordinates.length;
    const centroidLat = extent.sumLat / coordinates.length;
    const halfLng = Math.max(centroidLng - extent.minLng, extent.maxLng - centroidLng);
    const halfLat = Math.max(centroidLat - extent.minLat, extent.maxLat - centroidLat);
    const symmetric = {
      minLng: centroidLng - halfLng,
      maxLng: centroidLng + halfLng,
      minLat: centroidLat - halfLat,
      maxLat: centroidLat + halfLat,
    };
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: decoded,
    };
    return { geojson: feature, bounds: symmetric };
  }, [polylineStr]);

  // Center the route inside the visible peek region rather than the full
  // backdrop (the lower portion is hidden by the sheet). Solving for exact
  // vertical centering: given fitBounds centres within (top, height - bottom),
  // setting `bottom = hiddenPx + top` makes the midpoint land at peekPx / 2.
  // Fallback padding (when metrics unavailable) roughly matches a common phone.
  const padding = useMemo(() => {
    if (metrics && metrics.peekPx > 0 && metrics.backdropPx > 0) {
      const hiddenPx = Math.max(0, metrics.backdropPx - metrics.peekPx);
      return {
        top: TOP_PADDING_PX,
        bottom: hiddenPx + TOP_PADDING_PX,
        left: EDGE_PADDING_PX,
        right: EDGE_PADDING_PX,
      };
    }
    return { top: TOP_PADDING_PX, bottom: 240, left: EDGE_PADDING_PX, right: EDGE_PADDING_PX };
  }, [metrics]);

  // Re-fit whenever the map loads or the padding changes (e.g. viewport
  // resize / orientation change updates the measured peek/backdrop).
  useEffect(() => {
    if (!isLoaded) return;
    mapRef.current?.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding, duration: 0 },
    );
  }, [isLoaded, bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat, padding]);

  const onLoad = useCallback(() => setIsLoaded(true), []);

  // Mapbox's click event fires on tap but not on drag — safe to use for
  // deep-linking to the external route without interfering with pan/zoom.
  const onClick = useCallback(() => {
    if (!routeUrl) return;
    window.open(routeUrl, '_blank', 'noopener,noreferrer');
  }, [routeUrl]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
      style={{ position: 'absolute', inset: 0 }}
      scrollZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
      onLoad={onLoad}
      onClick={onClick}
      cursor={routeUrl ? 'pointer' : 'grab'}
    >
      <Source id="route" type="geojson" data={geojson}>
        <Layer {...ROUTE_LAYER_STYLE} />
      </Source>
    </Map>
  );
}
