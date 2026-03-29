'use client';

import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/components/rides/route-map').then((mod) => mod.RouteMap), {
  ssr: false,
  loading: () => <div className="aspect-3/2 animate-pulse rounded-xl bg-surface-sunken" />,
});

interface RouteMapLoaderProps {
  polylineStr: string;
  routeUrl?: string | null;
  routeName?: string | null;
  aspectRatio?: string;
}

export function RouteMapLoader({
  polylineStr,
  routeUrl,
  routeName,
  aspectRatio,
}: RouteMapLoaderProps) {
  return (
    <RouteMap
      polylineStr={polylineStr}
      routeUrl={routeUrl}
      routeName={routeName}
      aspectRatio={aspectRatio}
    />
  );
}
