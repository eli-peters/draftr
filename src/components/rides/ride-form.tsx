'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowsClockwise,
  MapTrifold,
  ArrowSquareOut,
  MapPin,
  Check,
  Bicycle,
  Path,
  CalendarDots,
  GearSix,
  PencilSimple,
  Prohibit,
} from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Card } from '@/components/ui/card';
import { RiderAvatar } from '@/components/ui/avatar';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { LocationPickerDrawer } from '@/components/rides/location-picker-drawer';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { todayDateString } from '@/config/formatting';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
import { serviceLabels } from '@/config/integrations';
import {
  createRide,
  updateRide,
  updateRecurringSeries,
  getLeaderRideConflicts,
  type CreateRideData,
  type UpdateRideData,
  type LeaderConflict,
} from '@/lib/rides/actions';
import { decodeStartPoint } from '@/lib/maps/decode-start-point';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const { rides: ridesContent, common, manage: manageContent } = appContent;
const form = ridesContent.form;
const rc = manageContent.recurringRides;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function FormCardBanner({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex w-full items-center gap-2 px-5 py-2.5 border-b border-border">
      <Icon weight="bold" className="size-3.5 shrink-0 text-foreground" />
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.06em] leading-4.25 whitespace-nowrap text-foreground">
        {label}
      </span>
    </div>
  );
}

function StaticLocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  if (!MAPBOX_TOKEN) return null;
  const pin = `pin-s+DE0387(${longitude},${latitude})`;
  const src = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${pin}/${longitude},${latitude},14,0/600x200@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
  return (
    <img
      src={src}
      alt=""
      className="w-full rounded-xl object-cover"
      style={{ aspectRatio: '3/1' }}
    />
  );
}

function OptionalTag() {
  return <span className="text-xs font-normal text-muted-foreground ml-1">{form.optional}</span>;
}

interface RideFormInitialData {
  title: string;
  description: string;
  ride_date: string;
  start_time: string;
  pace_group_id: string;
  distance_km: string;
  elevation_m: string;
  capacity: string;
  route_name: string;
  route_url: string;
  route_polyline: string;
  is_drop_ride: boolean;
  start_location_name?: string;
  start_location_address?: string;
  start_latitude?: number | null;
  start_longitude?: number | null;
}

export interface MeetingLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface RideFormProps {
  clubId: string;
  paceGroups: { id: string; name: string }[];
  rideId?: string;
  templateId?: string;
  initialData?: RideFormInitialData;
  seasonStart?: string;
  seasonEnd?: string;
  connectedServices?: IntegrationService[];
  eligibleLeaders?: { user_id: string; name: string; avatar_url: string | null }[];
  meetingLocations?: MeetingLocation[];
  returnTo?: string;
}

export function RideForm({
  clubId,
  paceGroups,
  rideId,
  templateId,
  initialData,
  seasonStart,
  seasonEnd,
  connectedServices = [],
  eligibleLeaders = [],
  meetingLocations = [],
  returnTo,
}: RideFormProps) {
  const router = useRouter();
  const isEdit = !!rideId;
  const isRecurringSeries = isEdit && !!templateId;
  const today = todayDateString();
  const effectiveMin = seasonStart && seasonStart > today ? seasonStart : today;

  // Form state
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndType, setRecurringEndType] = useState<'never' | 'after' | 'on_date'>('never');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [selectedCoLeaders, setSelectedCoLeaders] = useState<string[]>([]);
  const [coLeaderConflicts, setCoLeaderConflicts] = useState<LeaderConflict[]>([]);
  const [rideDate, setRideDate] = useState(initialData?.ride_date ?? '');
  const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) ?? '');
  const [isDropRide, setIsDropRide] = useState(initialData?.is_drop_ride ?? false);
  const [editScope, setEditScope] = useState<'this' | 'all'>('this');
  const [importOpen, setImportOpen] = useState(false);

  // Route data — managed as state, set by import or URL paste
  const [routePolyline, setRoutePolyline] = useState(initialData?.route_polyline ?? '');
  const [routeUrl, setRouteUrl] = useState(initialData?.route_url ?? '');
  const [routeName, setRouteName] = useState(initialData?.route_name ?? '');
  const [importedRouteName, setImportedRouteName] = useState<string | null>(
    initialData?.route_name || null,
  );
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [fetchRouteError, setFetchRouteError] = useState<string | null>(null);
  const [detectedService, setDetectedService] = useState<IntegrationService | null>(null);

  // Start location — auto-populated from route polyline or manual entry
  const [startLocationName, setStartLocationName] = useState(
    initialData?.start_location_name ?? '',
  );
  const [startLocationAddress, setStartLocationAddress] = useState(
    initialData?.start_location_address ?? '',
  );
  const [startLatitude, setStartLatitude] = useState<number | null>(
    initialData?.start_latitude ?? null,
  );
  const [startLongitude, setStartLongitude] = useState<number | null>(
    initialData?.start_longitude ?? null,
  );
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Paste URL input for non-connected leaders
  const pasteUrlRef = useRef<HTMLInputElement>(null);

  // Refs for setting uncontrolled input values on import
  const titleRef = useRef<HTMLInputElement>(null);
  const distanceRef = useRef<HTMLInputElement>(null);
  const elevationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Fetch co-leader conflicts when date changes
  const fetchConflicts = useCallback(
    async (date: string) => {
      if (!date || eligibleLeaders.length === 0) {
        setCoLeaderConflicts([]);
        return;
      }
      const ids = eligibleLeaders.map((l) => l.user_id);
      const conflicts = await getLeaderRideConflicts(date, ids);
      setCoLeaderConflicts(conflicts);
    },
    [eligibleLeaders],
  );

  useEffect(() => {
    if (!isEdit) fetchConflicts(rideDate);
  }, [rideDate, isEdit, fetchConflicts]);

  function clearRouteData(preserveUrl = false) {
    setImportedRouteName(null);
    setRouteName('');
    setRoutePolyline('');
    setDetectedService(null);
    if (!preserveUrl) {
      setRouteUrl('');
    }
    if (titleRef.current) titleRef.current.value = '';
    if (distanceRef.current) distanceRef.current.value = '';
    if (elevationRef.current) elevationRef.current.value = '';
    if (descriptionRef.current) descriptionRef.current.value = '';
    setStartLocationName('');
    setStartLocationAddress('');
    setStartLatitude(null);
    setStartLongitude(null);
  }

  async function applyRouteData(route: ImportableRoute) {
    if (titleRef.current && !titleRef.current.value) {
      titleRef.current.value = route.name;
    }
    if (distanceRef.current) {
      distanceRef.current.value = (route.distance_m / 1000).toFixed(1);
    }
    if (elevationRef.current) {
      elevationRef.current.value = String(Math.round(route.elevation_m));
    }
    if (descriptionRef.current && !descriptionRef.current.value && route.description) {
      descriptionRef.current.value = route.description;
    }
    // Auto-populate start location from polyline or explicit coordinates
    const startCoords = route.polyline
      ? (() => {
          try {
            return decodeStartPoint(route.polyline);
          } catch {
            return null;
          }
        })()
      : route.start_latitude && route.start_longitude
        ? { latitude: route.start_latitude, longitude: route.start_longitude }
        : null;

    if (route.polyline) {
      setRoutePolyline(route.polyline);
    }

    if (startCoords) {
      setStartLatitude(startCoords.latitude);
      setStartLongitude(startCoords.longitude);
      setIsGeocodingLocation(true);
      try {
        const location = await reverseGeocode(startCoords.latitude, startCoords.longitude);
        if (location) {
          setStartLocationName(location.name);
          setStartLocationAddress(location.address);
        }
      } catch {
        // Geocoding failed — leader can enter manually
      } finally {
        setIsGeocodingLocation(false);
      }
    }
    setRouteUrl(route.source_url);
    setRouteName(route.name);
    setImportedRouteName(route.name);
  }

  async function handleRouteImport(route: ImportableRoute) {
    setImportOpen(false);

    // If the route has no polyline, fetch full details (includes polyline for RWGPS)
    if (!route.polyline) {
      const rawId = route.id.replace(`${route.service}:`, '');
      const type = route.source_type === 'activity' ? 'trip' : 'route';
      try {
        const res = await fetch(
          `${routes.importRouteById(rawId)}?service=${route.service}&type=${type}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.route) {
            applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            return;
          }
        }
      } catch {
        // Fall through to apply what we have
      }
    }

    applyRouteData(route);
    toast.success(appContent.rides.importRoute.imported);
  }

  async function handlePasteUrlBlur() {
    const url = pasteUrlRef.current?.value?.trim();
    if (!url) return;

    setFetchRouteError(null);
    const parsed = parseRouteUrl(url);

    // Always store the URL even if we can't fetch data from it
    setRouteUrl(url);

    // Unrecognized service — try scraping public page for metadata
    if (!parsed) {
      setIsFetchingRoute(true);
      try {
        const res = await fetch(`${routes.scrapeRoute}?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.route) {
            applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            setImportOpen(false);
            return;
          }
        }
      } catch {
        // Scrape failed — store as link-only
      } finally {
        setIsFetchingRoute(false);
      }
      setImportedRouteName(form.routeLinkAdded);
      setImportOpen(false);
      return;
    }

    // If the leader has a connected account for this service, fetch route data
    if (!connectedServices.includes(parsed.service)) {
      // No connection — try scraping public page for metadata
      setDetectedService(parsed.service);
      setIsFetchingRoute(true);
      try {
        const res = await fetch(`${routes.scrapeRoute}?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.route) {
            applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            setImportOpen(false);
            return;
          }
        }
      } catch {
        // Scrape failed — fall through to link-only
      } finally {
        setIsFetchingRoute(false);
      }

      // Fallback: URL stored as link-only, show preview nudge
      setImportedRouteName(form.routeLinkAdded);
      setImportOpen(false);
      return;
    }

    setIsFetchingRoute(true);
    try {
      const res = await fetch(
        `${routes.importRouteById(parsed.id)}?service=${parsed.service}&type=${parsed.type}`,
      );
      if (!res.ok) {
        setFetchRouteError(form.fetchRouteError);
        setImportedRouteName(form.routeLinkAdded);
        return;
      }
      const data = await res.json();
      if (data.route) {
        applyRouteData(data.route as ImportableRoute);
        toast.success(appContent.rides.importRoute.imported);
        setImportOpen(false);
      }
    } catch {
      setFetchRouteError(form.fetchRouteError);
      setImportedRouteName(form.routeLinkAdded);
    } finally {
      setIsFetchingRoute(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const ride_date = fd.get('ride_date') as string;
    const start_time = fd.get('start_time') as string;
    const pace_group_id = fd.get('pace_group_id') as string;
    const capacity = fd.get('capacity') as string;

    if (!routeUrl) {
      setError(form.routeRequired);
      setIsPending(false);
      return;
    }

    if (!title || !ride_date || !start_time || !pace_group_id || !capacity) {
      setError(form.required);
      setIsPending(false);
      return;
    }

    const shared = {
      title,
      description: (fd.get('description') as string) || undefined,
      ride_date,
      start_time,
      pace_group_id,
      distance_km: fd.get('distance_km') ? Number(fd.get('distance_km')) : undefined,
      elevation_m: fd.get('elevation_m') ? Number(fd.get('elevation_m')) : undefined,
      capacity: Number(capacity),
      route_url: routeUrl,
      route_name: routeName || undefined,
      route_polyline: routePolyline || undefined,
      is_drop_ride: fd.get('is_drop_ride') === 'on',
      start_location_name: startLocationName || undefined,
      start_location_address: startLocationAddress || undefined,
      start_latitude: startLatitude ?? undefined,
      start_longitude: startLongitude ?? undefined,
    };

    let result: { error?: string; success?: boolean; rideId?: string };

    if (isEdit && editScope === 'all' && isRecurringSeries) {
      result = await updateRecurringSeries(rideId, shared as UpdateRideData);
    } else if (isEdit) {
      result = await updateRide(rideId, shared as UpdateRideData);
    } else {
      const recurrence = fd.get('recurrence') as string;
      let recurring: CreateRideData['recurring'] = undefined;
      if (isRecurring && recurrence) {
        const [y, m, d] = ride_date.split('-').map(Number);
        const endType = fd.get('recurring_end_type') as string;
        recurring = {
          recurrence,
          day_of_week: new Date(y, m - 1, d).getDay(),
          end_after_occurrences:
            endType === 'after' && fd.get('end_after') ? Number(fd.get('end_after')) : undefined,
          end_date: endType === 'on_date' ? (fd.get('end_date') as string) || undefined : undefined,
        };
      }

      result = await createRide({
        ...shared,
        club_id: clubId,
        recurring,
        co_leader_ids: selectedCoLeaders.length > 0 ? selectedCoLeaders : undefined,
      } as CreateRideData);
    }

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (!isEdit && result.rideId) {
        router.push(routes.ride(result.rideId));
      } else {
        router.push(returnTo && returnTo.startsWith('/') ? returnTo : routes.manage);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <fieldset disabled={isFetchingRoute} className="min-w-0 space-y-5">
        {/* ── Recurring series edit prompt (edit-only) ──────────────── */}
        {isRecurringSeries && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowsClockwise className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {ridesContent.edit.recurringPrompt}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                size="sm"
                variant={editScope === 'this' ? 'default' : 'outline'}
                onClick={() => setEditScope('this')}
              >
                {ridesContent.edit.editThisOnly}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editScope === 'all' ? 'default' : 'outline'}
                onClick={() => setEditScope('all')}
              >
                {ridesContent.edit.editAllFuture}
              </Button>
            </div>
          </div>
        )}

        {/* ── Card 1: Route (primary — prepopulates everything) ────── */}
        <Card className="overflow-hidden p-0">
          <FormCardBanner label={form.sectionRoute} icon={Path} />
          <div className="flex flex-col gap-4 px-6 pb-6 pt-3 min-w-0">
            {/* Route import area */}
            {importedRouteName ? (
              !routePolyline && detectedService ? (
                /* Link-only preview — show what riders will see + nudge to connect */
                <div className="rounded-xl bg-surface-sunken p-4 space-y-3">
                  <div className="rounded-lg bg-surface-page flex flex-col items-center justify-center gap-1.5 py-6">
                    <MapTrifold weight="duotone" className="size-8 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/60">
                      {form.linkOnlyPreviewLabel}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-info">
                      {form.linkOnlyViewRoute(serviceLabels[detectedService])}
                      <ArrowSquareOut className="size-3" />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.linkOnlyHint(serviceLabels[detectedService])}
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={routes.profileEdit}
                      className="text-xs font-medium text-info hover:underline"
                    >
                      {form.linkOnlyConnect(serviceLabels[detectedService])}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearRouteData()}
                    >
                      {form.linkOnlyRemove}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Route imported — show confirmation + map if polyline available */
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapTrifold className="size-5 shrink-0 text-primary" weight="duotone" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {form.importConfirmed(importedRouteName)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={
                        connectedServices.length > 0 && routePolyline
                          ? () => setImportOpen(true)
                          : () => clearRouteData(true)
                      }
                      className="shrink-0 rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                    >
                      <PencilSimple className="size-5" />
                    </Button>
                  </div>
                  {routePolyline && (
                    <RouteMapLoader
                      polylineStr={routePolyline}
                      routeUrl={routeUrl || null}
                      routeName={importedRouteName}
                      aspectRatio="5/2"
                    />
                  )}
                </div>
              )
            ) : (
              /* No route yet — single CTA to open the unified drawer */
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col items-center gap-3 text-center">
                <MapTrifold className="size-8 text-primary" weight="duotone" />
                <div>
                  <p className="text-sm font-medium text-foreground">{form.importHeading}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">
                    {form.importDescription}
                  </p>
                </div>
                <Button type="button" onClick={() => setImportOpen(true)}>
                  <MapTrifold className="mr-2 size-4" />
                  {appContent.rides.importRoute.button}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* ── Card 2: Basics ───────────────────────────────────────── */}
        <Card className="overflow-clip p-0">
          <FormCardBanner label={form.sectionBasics} icon={Bicycle} />
          <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
            <div className="space-y-2">
              <Label htmlFor="title">{form.title}</Label>
              <Input
                ref={titleRef}
                id="title"
                name="title"
                required
                defaultValue={initialData?.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {form.description}
                <OptionalTag />
              </Label>
              <Textarea
                ref={descriptionRef}
                id="description"
                name="description"
                rows={3}
                defaultValue={initialData?.description}
                placeholder={form.descriptionPlaceholder}
              />
              <p className="text-xs text-muted-foreground">{form.descriptionHelper}</p>
            </div>
            {/* Ride characteristics — 2×2 grid */}
            <div className="rounded-xl bg-accent-secondary-subtle p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="distance_km" className="text-sm text-foreground">
                    {form.distance}
                  </Label>
                  <Input
                    ref={distanceRef}
                    id="distance_km"
                    name="distance_km"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={initialData?.distance_km}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="elevation_m" className="text-sm text-foreground">
                    {form.elevation}
                  </Label>
                  <Input
                    ref={elevationRef}
                    id="elevation_m"
                    name="elevation_m"
                    type="number"
                    min="0"
                    defaultValue={initialData?.elevation_m}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="capacity" className="text-sm text-foreground">
                    {form.capacity}
                  </Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    required
                    defaultValue={initialData?.capacity}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pace_group_id" className="text-sm text-foreground">
                    {form.paceGroup}
                  </Label>
                  <Select
                    name="pace_group_id"
                    required
                    defaultValue={initialData?.pace_group_id ?? undefined}
                    items={Object.fromEntries(paceGroups.map((pg) => [pg.id, pg.name]))}
                  >
                    <SelectTrigger id="pace_group_id">
                      <SelectValue placeholder={form.selectPace} />
                    </SelectTrigger>
                    <SelectContent>
                      {paceGroups.map((pg) => (
                        <SelectItem key={pg.id} value={pg.id}>
                          {pg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Label htmlFor="is_drop_ride" className="text-sm text-foreground">
                      {form.isDropRide}
                    </Label>
                    <Switch
                      id="is_drop_ride"
                      checked={isDropRide}
                      onCheckedChange={setIsDropRide}
                    />
                    <input type="hidden" name="is_drop_ride" value={isDropRide ? 'on' : ''} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Card 3: When & Where ─────────────────────────────────── */}
        <Card className="overflow-clip p-0">
          <FormCardBanner label={form.sectionWhenWhere} icon={CalendarDots} />
          <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ride_date">{form.date}</Label>
                <DatePicker
                  id="ride_date"
                  name="ride_date"
                  value={rideDate}
                  onChange={setRideDate}
                  placeholder={form.pickDate}
                  min={effectiveMin}
                  max={seasonEnd || undefined}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">{form.startTime}</Label>
                <TimePicker
                  id="start_time"
                  name="start_time"
                  value={startTime}
                  onChange={setStartTime}
                  placeholder={form.pickTime}
                  required
                />
              </div>
            </div>

            {/* Start Location */}
            {isGeocodingLocation ? (
              <p className="text-[0.8125rem] text-muted-foreground">
                {form.startLocationFromRoute}
              </p>
            ) : startLocationName ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPin className="size-5 shrink-0 mt-0.5 text-primary" weight="duotone" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {startLocationName}
                      </p>
                      {startLocationAddress && (
                        <p className="text-[0.8125rem] text-muted-foreground truncate mt-0.5">
                          {startLocationAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocationPickerOpen(true)}
                    className="shrink-0 rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                  >
                    <PencilSimple className="size-5" />
                  </Button>
                </div>
                {startLatitude && startLongitude && (
                  <a
                    href={`https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(startLocationAddress || startLocationName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <StaticLocationMap latitude={startLatitude} longitude={startLongitude} />
                  </a>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLocationPickerOpen(true)}
                className="w-full rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center gap-2 text-center hover:bg-muted/20 transition-colors"
              >
                <MapPin className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {routeUrl ? form.startLocationManualHint : form.startLocationHint}
                </p>
              </button>
            )}
          </div>
        </Card>

        {/* ── Card 4: Settings ─────────────────────────────────────── */}
        <Card className="overflow-clip p-0">
          <FormCardBanner label={form.sectionAdditional} icon={GearSix} />
          <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
            {/* Co-leader picker (create mode only) */}
            {!isEdit && eligibleLeaders.length > 0 && (
              <div className="space-y-3">
                <Label>
                  {form.coLeaders}
                  <OptionalTag />
                </Label>
                <div className="flex flex-col gap-1">
                  {eligibleLeaders.map((leader) => {
                    const isSelected = selectedCoLeaders.includes(leader.user_id);
                    const conflict = coLeaderConflicts.find((c) => c.user_id === leader.user_id);
                    const hasConflict = !!conflict;
                    return (
                      <button
                        key={leader.user_id}
                        type="button"
                        disabled={hasConflict}
                        onClick={() =>
                          setSelectedCoLeaders((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== leader.user_id)
                              : [...prev, leader.user_id],
                          )
                        }
                        className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${hasConflict ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/50'}`}
                      >
                        <div className={`relative ${hasConflict ? 'grayscale' : ''}`}>
                          <RiderAvatar
                            avatarUrl={leader.avatar_url}
                            name={leader.name}
                            className={isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                          />
                          {isSelected && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-2.5" weight="bold" />
                            </span>
                          )}
                          {hasConflict && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <Prohibit className="size-2.5" weight="bold" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p
                            className={`text-sm truncate ${isSelected ? 'font-medium text-foreground' : hasConflict ? 'text-muted-foreground' : 'text-foreground'}`}
                          >
                            {leader.name}
                          </p>
                          {hasConflict && (
                            <p className="text-xs text-muted-foreground truncate">
                              {form.coLeadersUnavailable}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recurring schedule (create-only) */}
            {!isEdit && (
              <>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_recurring" className="flex items-center gap-2 cursor-pointer">
                    <ArrowsClockwise className="h-4 w-4 text-muted-foreground" />
                    {ridesContent.recurring.toggle}
                  </Label>
                  <Switch
                    id="is_recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="rounded-xl bg-accent-secondary-subtle p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="recurrence" className="text-sm text-foreground">
                          {ridesContent.recurring.frequency}
                        </Label>
                        <Select
                          name="recurrence"
                          defaultValue="weekly"
                          items={{
                            weekly: rc.recurrence.weekly,
                            biweekly: rc.recurrence.biweekly,
                            monthly: rc.recurrence.monthly,
                          }}
                        >
                          <SelectTrigger id="recurrence">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">{rc.recurrence.weekly}</SelectItem>
                            <SelectItem value="biweekly">{rc.recurrence.biweekly}</SelectItem>
                            <SelectItem value="monthly">{rc.recurrence.monthly}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="recurring_end_type" className="text-sm text-foreground">
                          {ridesContent.recurring.endCondition}
                        </Label>
                        <Select
                          name="recurring_end_type"
                          value={recurringEndType}
                          onValueChange={(v) =>
                            setRecurringEndType(v as 'never' | 'after' | 'on_date')
                          }
                          items={{
                            never: ridesContent.recurring.endNever,
                            after: ridesContent.recurring.endAfter,
                            on_date: ridesContent.recurring.endOnDate,
                          }}
                        >
                          <SelectTrigger id="recurring_end_type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">{ridesContent.recurring.endNever}</SelectItem>
                            <SelectItem value="after">{ridesContent.recurring.endAfter}</SelectItem>
                            <SelectItem value="on_date">
                              {ridesContent.recurring.endOnDate}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {recurringEndType === 'after' && (
                      <div className="space-y-1">
                        <Label htmlFor="end_after" className="text-sm text-foreground">
                          {ridesContent.recurring.occurrences}
                        </Label>
                        <Input
                          id="end_after"
                          name="end_after"
                          type="number"
                          min="1"
                          max="52"
                          defaultValue="10"
                        />
                      </div>
                    )}
                    {recurringEndType === 'on_date' && (
                      <div className="space-y-1">
                        <Label htmlFor="end_date" className="text-sm text-foreground">
                          {ridesContent.recurring.endOnDate}
                        </Label>
                        <DatePicker
                          id="end_date"
                          name="end_date"
                          value={recurringEndDate}
                          onChange={setRecurringEndDate}
                          placeholder={form.pickDate}
                          min={seasonStart || undefined}
                          max={seasonEnd || undefined}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <div className="flex flex-col-reverse items-center gap-3 md:flex-row md:justify-end">
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => router.back()}
            >
              {common.cancel}
            </button>
            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
              {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
            </Button>
          </div>
        </div>

        {/* Route import drawer */}
        <RouteImportDrawer
          open={importOpen}
          onOpenChange={setImportOpen}
          connectedServices={connectedServices}
          onSelect={handleRouteImport}
          pasteUrlRef={pasteUrlRef}
          isFetchingRoute={isFetchingRoute}
          fetchRouteError={fetchRouteError}
          onPasteUrl={handlePasteUrlBlur}
        />

        {/* Location picker drawer */}
        <LocationPickerDrawer
          open={locationPickerOpen}
          onOpenChange={setLocationPickerOpen}
          meetingLocations={meetingLocations}
          clubId={clubId}
          onConfirm={(location) => {
            setStartLocationName(location.name);
            setStartLocationAddress(location.address ?? '');
            setStartLatitude(location.latitude ?? null);
            setStartLongitude(location.longitude ?? null);
            setLocationPickerOpen(false);
          }}
        />
      </fieldset>
      {/* Hidden inputs outside fieldset so they're always submitted */}
      <input type="hidden" name="route_polyline" value={routePolyline} />
    </form>
  );
}
