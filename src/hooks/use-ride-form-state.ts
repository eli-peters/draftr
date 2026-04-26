'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { focusFirstError } from '@/lib/forms';
import { rideSchema, type RideValues } from '@/lib/forms/schemas';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
import { decodeStartPoint } from '@/lib/maps/decode-start-point';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';
import {
  createRide,
  updateRide,
  getLeaderRideConflicts,
  type CreateRideData,
  type UpdateRideData,
  type LeaderConflict,
} from '@/lib/rides/actions';
import type { IntegrationService, ImportableRoute } from '@/types/database';
import type { RideFormInitialData } from '@/types/rides';

const { rides: ridesContent } = appContent;
const form = ridesContent.form;

// ---------------------------------------------------------------------------
// State shape projected from RHF + UI state. Field names match the legacy
// reducer state so step components don't need to be rewritten — we just feed
// them a snapshot derived from RHF on every render.
// ---------------------------------------------------------------------------

export interface RideFormState {
  routeUrl: string;
  routeName: string;
  routePolyline: string;
  importedRouteName: string | null;
  detectedService: IntegrationService | null;
  isFetchingRoute: boolean;
  fetchRouteError: string | null;

  title: string;
  description: string;
  distanceKm: string;
  elevationM: string;
  capacity: string;
  paceGroupId: string;
  isDropRide: boolean;

  rideDate: string;
  startTime: string;
  startLocationName: string;
  startLocationAddress: string;
  startLatitude: number | null;
  startLongitude: number | null;
  isGeocodingLocation: boolean;

  selectedCoLeaders: string[];
  coLeaderConflicts: LeaderConflict[];

  isPending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

function buildDefaultValues(initialData?: RideFormInitialData): RideValues {
  return {
    routeUrl: initialData?.route_url ?? '',
    routeName: initialData?.route_name ?? '',
    routePolyline: initialData?.route_polyline ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    distanceKm: initialData?.distance_km ?? '',
    elevationM: initialData?.elevation_m ?? '',
    capacity: initialData?.capacity ?? '',
    paceGroupId: initialData?.pace_group_id ?? '',
    isDropRide: initialData?.is_drop_ride ?? false,
    rideDate: initialData?.ride_date ?? '',
    startTime: initialData?.start_time?.slice(0, 5) ?? '',
    startLocationName: initialData?.start_location_name ?? '',
    startLocationAddress: initialData?.start_location_address ?? '',
    startLatitude: initialData?.start_latitude ?? null,
    startLongitude: initialData?.start_longitude ?? null,
    selectedCoLeaders: [],
  };
}

interface UseRideFormStateOptions {
  initialData?: RideFormInitialData;
  rideId?: string;
  clubId: string;
  connectedServices: IntegrationService[];
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  initialCoLeaderIds?: string[];
  returnTo?: string;
}

export interface UseRideFormStateReturn {
  state: RideFormState;
  /** RHF instance — wrap the form with `<Form {...form}>` to provide context. */
  form: UseFormReturn<RideValues>;
  setField: <K extends keyof RideFormState>(field: K, value: RideFormState[K]) => void;
  pasteUrlRef: React.RefObject<HTMLInputElement | null>;
  isEdit: boolean;
  handleRouteImport: (route: ImportableRoute) => Promise<void>;
  handlePasteUrlBlur: () => Promise<void>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  clearRouteData: (preserveUrl?: boolean) => void;
}

export function useRideFormState({
  initialData,
  rideId,
  clubId,
  connectedServices,
  eligibleLeaders,
  initialCoLeaderIds,
  returnTo,
}: UseRideFormStateOptions): UseRideFormStateReturn {
  const router = useRouter();
  const isEdit = !!rideId;

  // ── RHF instance ───────────────────────────────────────────────────────
  const formInstance = useForm<RideValues>({
    resolver: zodResolver(rideSchema),
    defaultValues: useMemo(() => buildDefaultValues(initialData), [initialData]),
    mode: 'onTouched',
  });

  // ── Watched values — every render produces a fresh snapshot ────────────
  const watched = formInstance.watch();

  // ── UI-only state (not part of the validated form payload) ─────────────
  const [importedRouteName, setImportedRouteName] = useState<string | null>(
    initialData?.route_name || null,
  );
  const [detectedService, setDetectedService] = useState<IntegrationService | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [fetchRouteError, setFetchRouteError] = useState<string | null>(null);
  const [coLeaderConflicts, setCoLeaderConflicts] = useState<LeaderConflict[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const pasteUrlRef = useRef<HTMLInputElement>(null);

  // ── Pre-select co-leaders when editing ─────────────────────────────────
  const didInitCoLeaders = useRef(false);
  useEffect(() => {
    if (initialCoLeaderIds?.length && !didInitCoLeaders.current) {
      didInitCoLeaders.current = true;
      formInstance.setValue('selectedCoLeaders', initialCoLeaderIds);
    }
  }, [initialCoLeaderIds, formInstance]);

  // ── Co-leader conflict fetching when ride date changes ─────────────────
  const fetchConflicts = useCallback(
    async (date: string) => {
      if (!date || eligibleLeaders.length === 0) {
        setCoLeaderConflicts([]);
        return;
      }
      const ids = eligibleLeaders.map((l) => l.user_id);
      const conflicts = await getLeaderRideConflicts(date, ids, rideId);
      setCoLeaderConflicts(conflicts);
    },
    [eligibleLeaders, rideId],
  );

  useEffect(() => {
    fetchConflicts(watched.rideDate ?? '');
  }, [watched.rideDate, fetchConflicts]);

  // ── Project RHF values + UI state into the legacy `state` shape ────────
  const fieldErrorMap = useMemo(() => {
    const mapped: Record<string, string> = {};
    for (const [key, err] of Object.entries(formInstance.formState.errors)) {
      const message = (err as { message?: string } | undefined)?.message;
      if (message) mapped[key] = message;
    }
    return mapped;
  }, [formInstance.formState.errors]);

  const state: RideFormState = {
    routeUrl: watched.routeUrl ?? '',
    routeName: watched.routeName ?? '',
    routePolyline: watched.routePolyline ?? '',
    importedRouteName,
    detectedService,
    isFetchingRoute,
    fetchRouteError,

    title: watched.title ?? '',
    description: watched.description ?? '',
    distanceKm: watched.distanceKm ?? '',
    elevationM: watched.elevationM ?? '',
    capacity: watched.capacity ?? '',
    paceGroupId: watched.paceGroupId ?? '',
    isDropRide: watched.isDropRide ?? false,

    rideDate: watched.rideDate ?? '',
    startTime: watched.startTime ?? '',
    startLocationName: watched.startLocationName ?? '',
    startLocationAddress: watched.startLocationAddress ?? '',
    startLatitude: watched.startLatitude ?? null,
    startLongitude: watched.startLongitude ?? null,
    isGeocodingLocation,

    selectedCoLeaders: watched.selectedCoLeaders ?? [],
    coLeaderConflicts,

    isPending,
    error: serverError,
    fieldErrors: fieldErrorMap,
  };

  // ── Field setter — preserves the legacy step-component contract ────────
  const setField = useCallback(
    <K extends keyof RideFormState>(field: K, value: RideFormState[K]) => {
      // Map legacy field keys to RHF field paths. UI-only fields go to local state.
      switch (field) {
        case 'importedRouteName':
          setImportedRouteName(value as string | null);
          return;
        case 'detectedService':
          setDetectedService(value as IntegrationService | null);
          return;
        case 'isFetchingRoute':
          setIsFetchingRoute(value as boolean);
          return;
        case 'fetchRouteError':
          setFetchRouteError(value as string | null);
          return;
        case 'isGeocodingLocation':
          setIsGeocodingLocation(value as boolean);
          return;
        case 'coLeaderConflicts':
          setCoLeaderConflicts(value as LeaderConflict[]);
          return;
        case 'fieldErrors':
        case 'isPending':
        case 'error':
          // No-op — these are derived in the new model.
          return;
        default:
          formInstance.setValue(field as keyof RideValues, value as never, {
            shouldValidate: false,
            shouldDirty: true,
          });
      }
    },
    [formInstance],
  );

  // ── Apply route data after import or scrape ────────────────────────────
  async function applyRouteData(route: ImportableRoute) {
    const startCoords = route.polyline
      ? (() => {
          try {
            return decodeStartPoint(route.polyline);
          } catch (err) {
            console.warn('[ride-form] polyline decode failed:', err);
            return null;
          }
        })()
      : route.start_latitude && route.start_longitude
        ? { latitude: route.start_latitude, longitude: route.start_longitude }
        : null;

    const currentTitle = formInstance.getValues('title');
    const currentDescription = formInstance.getValues('description') ?? '';

    const dirty = { shouldDirty: true } as const;
    formInstance.setValue('routeUrl', route.source_url, dirty);
    formInstance.setValue('routeName', route.name, dirty);
    formInstance.setValue('routePolyline', route.polyline || '', dirty);
    if (!currentTitle) formInstance.setValue('title', route.name, dirty);
    if (!currentDescription && route.description) {
      formInstance.setValue('description', route.description.slice(0, 250), dirty);
    }
    if (route.distance_m) {
      formInstance.setValue('distanceKm', (route.distance_m / 1000).toFixed(1), dirty);
    }
    if (route.elevation_m) {
      formInstance.setValue('elevationM', String(Math.round(route.elevation_m)), dirty);
    }
    formInstance.setValue('startLatitude', startCoords?.latitude ?? null, dirty);
    formInstance.setValue('startLongitude', startCoords?.longitude ?? null, dirty);

    setImportedRouteName(route.name);
    setDetectedService(route.service ?? null);
    setFetchRouteError(null);
    setIsFetchingRoute(false);

    // Clear any pre-existing routeUrl validation error.
    formInstance.clearErrors('routeUrl');

    if (startCoords) {
      setIsGeocodingLocation(true);
      try {
        const location = await reverseGeocode(startCoords.latitude, startCoords.longitude);
        if (location) {
          formInstance.setValue('startLocationName', location.name, dirty);
          formInstance.setValue('startLocationAddress', location.address, dirty);
        }
      } catch (err) {
        console.warn('[ride-form] reverseGeocode failed:', err);
      } finally {
        setIsGeocodingLocation(false);
      }
    }
  }

  // ── Route import handler ───────────────────────────────────────────────
  async function handleRouteImport(route: ImportableRoute) {
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
            await applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            return;
          }
        }
      } catch {
        // Fall through to apply what we have
      }
    }
    await applyRouteData(route);
    toast.success(appContent.rides.importRoute.imported);
  }

  // ── Paste URL handler ──────────────────────────────────────────────────
  async function tryScrapeAndApply(url: string): Promise<boolean> {
    setIsFetchingRoute(true);
    try {
      const res = await fetch(`${routes.scrapeRoute}?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.route) {
          await applyRouteData(data.route as ImportableRoute);
          toast.success(appContent.rides.importRoute.imported);
          return true;
        }
      }
    } catch {
      // Scrape failed — caller handles fallback
    }
    return false;
  }

  function setLinkOnly(routeName: string, service?: IntegrationService | null) {
    setImportedRouteName(routeName);
    if (service !== undefined) setDetectedService(service);
    setIsFetchingRoute(false);
  }

  async function handlePasteUrlBlur() {
    const url = pasteUrlRef.current?.value?.trim();
    if (!url) return;

    setFetchRouteError(null);
    formInstance.clearErrors('routeUrl');
    formInstance.setValue('routeUrl', url, { shouldDirty: true });

    const parsed = parseRouteUrl(url);

    if (!parsed) {
      if (!(await tryScrapeAndApply(url))) {
        setLinkOnly(form.routeLinkAdded);
      }
      return;
    }

    if (!connectedServices.includes(parsed.service)) {
      setDetectedService(parsed.service);
      if (!(await tryScrapeAndApply(url))) {
        setLinkOnly(form.routeLinkAdded, parsed.service);
      }
      return;
    }

    setIsFetchingRoute(true);
    try {
      const res = await fetch(
        `${routes.importRouteById(parsed.id)}?service=${parsed.service}&type=${parsed.type}`,
      );
      if (!res.ok) {
        setFetchRouteError(form.fetchRouteError);
        setLinkOnly(form.routeLinkAdded);
        return;
      }
      const data = await res.json();
      if (data.route) {
        await applyRouteData(data.route as ImportableRoute);
        toast.success(appContent.rides.importRoute.imported);
      }
    } catch {
      setFetchRouteError(form.fetchRouteError);
      setLinkOnly(form.routeLinkAdded);
    }
  }

  // ── Clear route data ───────────────────────────────────────────────────
  function clearRouteData(preserveUrl = false) {
    const dirty = { shouldDirty: true } as const;
    setImportedRouteName(null);
    setDetectedService(null);
    formInstance.setValue('routeName', '', dirty);
    formInstance.setValue('routePolyline', '', dirty);
    if (!preserveUrl) formInstance.setValue('routeUrl', '', dirty);
    formInstance.setValue('title', '', dirty);
    formInstance.setValue('description', '', dirty);
    formInstance.setValue('distanceKm', '', dirty);
    formInstance.setValue('elevationM', '', dirty);
    formInstance.setValue('startLocationName', '', dirty);
    formInstance.setValue('startLocationAddress', '', dirty);
    formInstance.setValue('startLatitude', null, dirty);
    formInstance.setValue('startLongitude', null, dirty);
  }

  // ── Submission ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      formInstance.handleSubmit(async (values) => {
        setIsPending(true);
        setServerError(null);

        const shared = {
          title: values.title,
          description: values.description || undefined,
          ride_date: values.rideDate,
          start_time: values.startTime,
          pace_group_id: values.paceGroupId,
          distance_km: values.distanceKm ? Number(values.distanceKm) : undefined,
          elevation_m: values.elevationM ? Number(values.elevationM) : undefined,
          capacity: Number(values.capacity),
          route_url: values.routeUrl,
          route_name: values.routeName || undefined,
          route_polyline: values.routePolyline || undefined,
          is_drop_ride: values.isDropRide ?? false,
          start_location_name: values.startLocationName || undefined,
          start_location_address: values.startLocationAddress || undefined,
          start_latitude: values.startLatitude ?? undefined,
          start_longitude: values.startLongitude ?? undefined,
        };

        let result: { error?: string; success?: boolean; rideId?: string };
        try {
          if (isEdit) {
            result = await updateRide(rideId!, {
              ...shared,
              co_leader_ids: values.selectedCoLeaders,
            } as UpdateRideData);
          } else {
            result = await createRide({
              ...shared,
              club_id: clubId,
              co_leader_ids:
                values.selectedCoLeaders.length > 0 ? values.selectedCoLeaders : undefined,
            } as CreateRideData);
          }
        } catch (err) {
          // Re-throw NEXT_REDIRECT so the framework navigates.
          if (
            err &&
            typeof err === 'object' &&
            'digest' in err &&
            typeof (err as { digest?: unknown }).digest === 'string' &&
            (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
          ) {
            throw err;
          }
          setIsPending(false);
          setServerError(appContent.validation.generic.submitFailed);
          return;
        }

        setIsPending(false);
        if (result.error) {
          setServerError(result.error);
        } else if (!isEdit && result.rideId) {
          router.push(routes.ride(result.rideId));
        } else {
          router.push(returnTo && returnTo.startsWith('/') ? returnTo : routes.manageRides);
        }
      }, focusFirstError(formInstance))(e);
    },
    [formInstance, isEdit, rideId, clubId, returnTo, router],
  );

  return {
    state,
    form: formInstance,
    setField,
    pasteUrlRef,
    isEdit,
    handleRouteImport,
    handlePasteUrlBlur,
    handleSubmit,
    clearRouteData,
  };
}
