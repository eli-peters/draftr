'use client';

import dynamic from 'next/dynamic';

const LocationMap = dynamic(
  () => import('@/components/rides/location-map').then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => <div className="aspect-5/2 animate-pulse rounded-xl bg-surface-sunken" />,
  },
);

interface LocationMapLoaderProps {
  latitude: number;
  longitude: number;
  aspectRatio?: string;
}

export function LocationMapLoader({ latitude, longitude, aspectRatio }: LocationMapLoaderProps) {
  return <LocationMap latitude={latitude} longitude={longitude} aspectRatio={aspectRatio} />;
}
