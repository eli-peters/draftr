'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { MapPin, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';
import { saveMeetingLocation } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { MeetingLocation } from '@/components/rides/ride-form';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

const form = appContent.rides.form;

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface LocationResult {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingLocations: MeetingLocation[];
  clubId: string;
  onConfirm: (location: LocationResult) => void;
}

export function LocationPickerDrawer({
  open,
  onOpenChange,
  meetingLocations,
  clubId,
  onConfirm,
}: LocationPickerDrawerProps) {
  const isMobile = useIsMobile();
  const mapRef = useRef<MapRef>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [saveToClub, setSaveToClub] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Detect dark mode for map style
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads DOM classList once on open
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [open]);

  // Reset state when drawer opens
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets form state on open transition
    setSearchQuery('');
    setPredictions([]);
    setName('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setSaveToClub(false);
  }, [open]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setPredictions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${routes.placesAutocomplete}?input=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions ?? []);
        }
      } catch {
        // Search failed silently
      }
    }, 300);
  }, []);

  // Select a prediction
  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    setPredictions([]);
    setSearchQuery('');

    try {
      const res = await fetch(
        `${routes.placesDetails}?placeId=${encodeURIComponent(prediction.placeId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setName(data.name || prediction.mainText);
        setAddress(data.address || '');
        setLatitude(data.latitude ?? null);
        setLongitude(data.longitude ?? null);

        if (data.latitude && data.longitude && mapRef.current) {
          mapRef.current.flyTo({
            center: [data.longitude, data.latitude],
            zoom: 15,
            duration: 800,
          });
        }
      }
    } catch {
      setName(prediction.mainText);
      setAddress(prediction.secondaryText);
    }
  }, []);

  // Select a saved location
  const handleSelectSaved = useCallback((location: MeetingLocation) => {
    setName(location.name);
    setAddress(location.address || '');
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setPredictions([]);
    setSearchQuery('');

    if (location.latitude && location.longitude && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, []);

  // Map click
  const handleMapClick = useCallback(async (e: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = e.lngLat;
    setLatitude(lat);
    setLongitude(lng);

    const result = await reverseGeocode(lat, lng);
    if (result) {
      setName(result.name);
      setAddress(result.address);
    }
  }, []);

  // Marker drag end
  const handleMarkerDragEnd = useCallback(async (e: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = e.lngLat;
    setLatitude(lat);
    setLongitude(lng);

    const result = await reverseGeocode(lat, lng);
    if (result) {
      setName(result.name);
      setAddress(result.address);
    }
  }, []);

  // Confirm selection
  const handleConfirm = useCallback(async () => {
    if (!name) return;
    setIsPending(true);

    if (saveToClub && clubId) {
      await saveMeetingLocation(clubId, {
        name,
        address: address || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });
    }

    onConfirm({ name, address, latitude, longitude });
    setIsPending(false);
  }, [name, address, latitude, longitude, saveToClub, clubId, onConfirm]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent
        className={
          isMobile
            ? 'max-h-(--drawer-height-lg) overflow-hidden flex flex-col'
            : 'w-(--drawer-width-sidebar) overflow-hidden flex flex-col'
        }
      >
        <DrawerHeader>
          <DrawerTitle>{form.locationPickerHeading}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={form.locationPickerSearch}
              className="pl-8"
            />
            {predictions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => handleSelectPrediction(p)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.mainText}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.secondaryText}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Locations */}
          {meetingLocations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {form.locationPickerSavedHeading}
              </p>
              <div className="flex flex-wrap gap-2">
                {meetingLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectSaved(loc)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                      name === loc.name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-foreground hover:bg-muted'
                    }`}
                  >
                    <MapPin className="size-3.5" weight={name === loc.name ? 'fill' : 'regular'} />
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {MAPBOX_TOKEN && (
            <div className="rounded-xl overflow-hidden border border-border h-48">
              <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: latitude && longitude ? longitude : -79.38,
                  latitude: latitude && longitude ? latitude : 43.65,
                  zoom: latitude && longitude ? 14 : 10,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={isDark ? DARK_STYLE : LIGHT_STYLE}
                attributionControl={false}
                onClick={handleMapClick}
                cursor="crosshair"
              >
                {latitude && longitude && (
                  <Marker
                    longitude={longitude}
                    latitude={latitude}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                  />
                )}
              </Map>
              {!latitude && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  {form.locationPickerMapHint}
                </p>
              )}
            </div>
          )}

          {/* Location details */}
          {name && (
            <div className="space-y-4">
              <FloatingField label={form.meetingLocation} htmlFor="loc_name" hasValue={!!name}>
                <Input
                  id="loc_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=" "
                />
              </FloatingField>
              <FloatingField
                label={form.locationAddress}
                htmlFor="loc_address"
                hasValue={!!address}
              >
                <Input
                  id="loc_address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder=" "
                />
              </FloatingField>
              <div className="flex items-center justify-between">
                <Label htmlFor="save_to_club" className="cursor-pointer">
                  {form.locationPickerSaveToggle}
                </Label>
                <Switch id="save_to_club" checked={saveToClub} onCheckedChange={setSaveToClub} />
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleConfirm} disabled={!name || isPending} className="w-full">
            {form.locationPickerConfirm}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
