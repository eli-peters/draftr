'use client';

import { useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  aspectRatio?: string;
}

export function LocationMap({ latitude, longitude, aspectRatio = '5/2' }: LocationMapProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!MAPBOX_TOKEN) return null;

  return (
    <div className="w-full overflow-clip rounded-xl">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
        style={{ width: '100%', height: 'auto', aspectRatio }}
        initialViewState={{ longitude, latitude, zoom: 14 }}
        interactive={false}
        scrollZoom={false}
        attributionControl={false}
      >
        <Marker longitude={longitude} latitude={latitude} />
      </Map>
    </div>
  );
}
