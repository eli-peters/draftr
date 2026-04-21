'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/mapbox';
import polyline from '@mapbox/polyline';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import './map-styles';
import { integrations, serviceIcons, serviceLabels } from '@/config/integrations';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
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
  routeName?: string | null;
  className?: string;
}

export function RouteMapBackdrop({
  polylineStr,
  routeUrl,
  routeName,
  className,
}: RouteMapBackdropProps) {
  const parsed = routeUrl ? parseRouteUrl(routeUrl) : null;
  const service = parsed?.service ?? null;

  if (!polylineStr || !MAPBOX_TOKEN) {
    return <div className={cn('absolute inset-0 bg-muted', className)} aria-hidden />;
  }

  return (
    <div className={cn('absolute inset-0', className)}>
      <MapInner polylineStr={polylineStr} routeUrl={routeUrl} />
      {service && routeUrl && (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View route${routeName ? ` "${routeName}"` : ''} on ${serviceLabels[service]}`}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top)+0.5rem)] z-20 inline-flex items-center gap-1.5 rounded-full bg-background/90 py-1.5 pl-3 pr-2.5 text-xs font-medium text-foreground shadow-sm backdrop-blur focus-ring"
        >
          <ServiceChipIcon service={service} />
          {serviceLabels[service]}
          <ArrowSquareOut className="size-3.5 text-muted-foreground" weight="bold" />
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ServiceChipIcon({ service }: { service: 'strava' | 'ridewithgps' }) {
  const Icon = serviceIcons[service];
  return <Icon className="size-3.5" />;
}

interface MapInnerProps {
  polylineStr: string;
  routeUrl?: string | null;
}

function MapInner({ polylineStr, routeUrl }: MapInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const decoded = polyline.toGeoJSON(polylineStr);
  const coordinates = decoded.coordinates as [number, number][];

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

  // Bias the fit so the route centres in the visible peek area, not the
  // middle of the backdrop (which will be hidden by the sheet).
  const onLoad = useCallback(() => {
    mapRef.current?.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: { top: 56, bottom: 280, left: 32, right: 32 }, duration: 0 },
    );
  }, [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat]);

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
