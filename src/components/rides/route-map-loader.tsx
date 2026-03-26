'use client';

import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/components/rides/route-map').then((mod) => mod.RouteMap), {
  ssr: false,
  loading: () => <div className="aspect-video animate-pulse rounded-xl bg-surface-sunken" />,
});

interface RouteMapLoaderProps {
  polylineStr: string;
  routeUrl?: string | null;
  routeName?: string | null;
}

export function RouteMapLoader({ polylineStr, routeUrl, routeName }: RouteMapLoaderProps) {
  return <RouteMap polylineStr={polylineStr} routeUrl={routeUrl} routeName={routeName} />;
}
