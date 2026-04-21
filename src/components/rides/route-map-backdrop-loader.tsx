'use client';

import dynamic from 'next/dynamic';

const RouteMapBackdrop = dynamic(
  () => import('@/components/rides/route-map-backdrop').then((mod) => mod.RouteMapBackdrop),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />,
  },
);

interface RouteMapBackdropLoaderProps {
  polylineStr?: string | null;
  routeUrl?: string | null;
}

export function RouteMapBackdropLoader({ polylineStr, routeUrl }: RouteMapBackdropLoaderProps) {
  return <RouteMapBackdrop polylineStr={polylineStr} routeUrl={routeUrl} />;
}
