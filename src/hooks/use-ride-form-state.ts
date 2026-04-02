'use client';

import { useReducer, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
import { decodeStartPoint } from '@/lib/maps/decode-start-point';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';
import {
  createRide,
  updateRide,
  updateRecurringSeries,
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
// State shape
// ---------------------------------------------------------------------------

export interface RideFormState {
  // Route
  routeUrl: string;
  routeName: string;
  routePolyline: string;
  importedRouteName: string | null;
  detectedService: IntegrationService | null;
  isFetchingRoute: boolean;
  fetchRouteError: string | null;

  // Details (controlled)
  title: string;
  description: string;
  distanceKm: string;
  elevationM: string;
  capacity: string;
  paceGroupId: string;
  isDropRide: boolean;

  // When & Where
  rideDate: string;
  startTime: string;
  startLocationName: string;
  startLocationAddress: string;
  startLatitude: number | null;
  startLongitude: number | null;
  isGeocodingLocation: boolean;

  // Additional
  selectedCoLeaders: string[];
  coLeaderConflicts: LeaderConflict[];
  isRecurring: boolean;
  recurringEndType: 'never' | 'after' | 'on_date';
  recurringEndDate: string;

  // UI
  editScope: 'this' | 'all';

  // Form
  isPending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type RideFormAction =
  | { type: 'SET_FIELD'; field: keyof RideFormState; value: RideFormState[keyof RideFormState] }
  | {
      type: 'APPLY_ROUTE_DATA';
      payload: {
        routeUrl: string;
        routeName: string;
        routePolyline: string;
        title?: string;
        description?: string;
        distanceKm?: string;
        elevationM?: string;
        startLatitude?: number | null;
        startLongitude?: number | null;
      };
    }
  | { type: 'CLEAR_ROUTE_DATA'; preserveUrl?: boolean }
  | { type: 'GEOCODING_START' }
  | {
      type: 'GEOCODING_COMPLETE';
      payload: { name: string; address: string } | null;
    }
  | { type: 'TOGGLE_CO_LEADER'; userId: string }
  | { type: 'SET_CO_LEADER_CONFLICTS'; conflicts: LeaderConflict[] }
  | { type: 'SET_PENDING'; value: boolean }
  | { type: 'SET_ERROR'; value: string | null }
  | { type: 'SET_FIELD_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_LINK_ONLY'; routeName: string; detectedService?: IntegrationService | null };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function rideFormReducer(state: RideFormState, action: RideFormAction): RideFormState {
  switch (action.type) {
    case 'SET_FIELD': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.field]: _cleared, ...remainingErrors } = state.fieldErrors;
      return { ...state, [action.field]: action.value, fieldErrors: remainingErrors };
    }

    case 'APPLY_ROUTE_DATA': {
      const { payload } = action;
      return {
        ...state,
        routeUrl: payload.routeUrl,
        routeName: payload.routeName,
        routePolyline: payload.routePolyline,
        importedRouteName: payload.routeName,
        // Only overwrite title if currently empty
        title: state.title ? state.title : (payload.title ?? state.title),
        // Only overwrite description if currently empty
        description: state.description
          ? state.description
          : (payload.description ?? state.description),
        distanceKm: payload.distanceKm ?? state.distanceKm,
        elevationM: payload.elevationM ?? state.elevationM,
        startLatitude: payload.startLatitude ?? state.startLatitude,
        startLongitude: payload.startLongitude ?? state.startLongitude,
        fetchRouteError: null,
        isFetchingRoute: false,
      };
    }

    case 'CLEAR_ROUTE_DATA':
      return {
        ...state,
        importedRouteName: null,
        routeName: '',
        routePolyline: '',
        detectedService: null,
        routeUrl: action.preserveUrl ? state.routeUrl : '',
        title: '',
        distanceKm: '',
        elevationM: '',
        description: '',
        startLocationName: '',
        startLocationAddress: '',
        startLatitude: null,
        startLongitude: null,
      };

    case 'GEOCODING_START':
      return { ...state, isGeocodingLocation: true };

    case 'GEOCODING_COMPLETE':
      return {
        ...state,
        isGeocodingLocation: false,
        ...(action.payload
          ? {
              startLocationName: action.payload.name,
              startLocationAddress: action.payload.address,
            }
          : {}),
      };

    case 'TOGGLE_CO_LEADER': {
      const isSelected = state.selectedCoLeaders.includes(action.userId);
      return {
        ...state,
        selectedCoLeaders: isSelected
          ? state.selectedCoLeaders.filter((id) => id !== action.userId)
          : [...state.selectedCoLeaders, action.userId],
      };
    }

    case 'SET_CO_LEADER_CONFLICTS':
      return { ...state, coLeaderConflicts: action.conflicts };

    case 'SET_PENDING':
      return { ...state, isPending: action.value };

    case 'SET_ERROR':
      return { ...state, error: action.value };

    case 'SET_FIELD_ERRORS':
      return { ...state, fieldErrors: action.errors };

    case 'SET_LINK_ONLY':
      return {
        ...state,
        importedRouteName: action.routeName,
        detectedService: action.detectedService ?? state.detectedService,
        isFetchingRoute: false,
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Initial state builder
// ---------------------------------------------------------------------------

function buildInitialState(initialData?: RideFormInitialData): RideFormState {
  return {
    // Route
    routeUrl: initialData?.route_url ?? '',
    routeName: initialData?.route_name ?? '',
    routePolyline: initialData?.route_polyline ?? '',
    importedRouteName: initialData?.route_name || null,
    detectedService: null,
    isFetchingRoute: false,
    fetchRouteError: null,

    // Details
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    distanceKm: initialData?.distance_km ?? '',
    elevationM: initialData?.elevation_m ?? '',
    capacity: initialData?.capacity ?? '',
    paceGroupId: initialData?.pace_group_id ?? '',
    isDropRide: initialData?.is_drop_ride ?? false,

    // When & Where
    rideDate: initialData?.ride_date ?? '',
    startTime: initialData?.start_time?.slice(0, 5) ?? '',
    startLocationName: initialData?.start_location_name ?? '',
    startLocationAddress: initialData?.start_location_address ?? '',
    startLatitude: initialData?.start_latitude ?? null,
    startLongitude: initialData?.start_longitude ?? null,
    isGeocodingLocation: false,

    // Additional
    selectedCoLeaders: [],
    coLeaderConflicts: [],
    isRecurring: false,
    recurringEndType: 'never',
    recurringEndDate: '',

    // UI
    editScope: 'this',

    // Form
    isPending: false,
    error: null,
    fieldErrors: {},
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseRideFormStateOptions {
  initialData?: RideFormInitialData;
  rideId?: string;
  templateId?: string;
  clubId: string;
  connectedServices: IntegrationService[];
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  initialCoLeaderIds?: string[];
  returnTo?: string;
}

export function useRideFormState({
  initialData,
  rideId,
  templateId,
  clubId,
  connectedServices,
  eligibleLeaders,
  initialCoLeaderIds,
  returnTo,
}: UseRideFormStateOptions) {
  const router = useRouter();
  const isEdit = !!rideId;
  const isRecurringSeries = isEdit && !!templateId;

  const [state, dispatch] = useReducer(rideFormReducer, initialData, buildInitialState);

  // Paste URL ref stays as a ref (ephemeral drawer input)
  const pasteUrlRef = useRef<HTMLInputElement>(null);

  // Pre-select co-leaders when editing
  const didInitCoLeaders = useRef(false);
  useEffect(() => {
    if (initialCoLeaderIds?.length && !didInitCoLeaders.current) {
      didInitCoLeaders.current = true;
      dispatch({ type: 'SET_FIELD', field: 'selectedCoLeaders', value: initialCoLeaderIds });
    }
  }, [initialCoLeaderIds]);

  // ── Co-leader conflict fetching ─────────────────────────────────────────

  const fetchConflicts = useCallback(
    async (date: string) => {
      if (!date || eligibleLeaders.length === 0) {
        dispatch({ type: 'SET_CO_LEADER_CONFLICTS', conflicts: [] });
        return;
      }
      const ids = eligibleLeaders.map((l) => l.user_id);
      const conflicts = await getLeaderRideConflicts(date, ids);
      dispatch({ type: 'SET_CO_LEADER_CONFLICTS', conflicts });
    },
    [eligibleLeaders],
  );

  useEffect(() => {
    if (!isEdit) fetchConflicts(state.rideDate);
  }, [state.rideDate, isEdit, fetchConflicts]);

  // ── Route data application (async — handles geocoding) ─────────────────

  async function applyRouteData(route: ImportableRoute) {
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

    dispatch({
      type: 'APPLY_ROUTE_DATA',
      payload: {
        routeUrl: route.source_url,
        routeName: route.name,
        routePolyline: route.polyline || '',
        title: route.name,
        description: route.description || undefined,
        distanceKm: route.distance_m ? (route.distance_m / 1000).toFixed(1) : undefined,
        elevationM: route.elevation_m ? String(Math.round(route.elevation_m)) : undefined,
        startLatitude: startCoords?.latitude ?? null,
        startLongitude: startCoords?.longitude ?? null,
      },
    });

    if (startCoords) {
      dispatch({ type: 'GEOCODING_START' });
      try {
        const location = await reverseGeocode(startCoords.latitude, startCoords.longitude);
        dispatch({
          type: 'GEOCODING_COMPLETE',
          payload: location ? { name: location.name, address: location.address } : null,
        });
      } catch {
        dispatch({ type: 'GEOCODING_COMPLETE', payload: null });
      }
    }
  }

  // ── Route import handler ────────────────────────────���───────────────────

  async function handleRouteImport(route: ImportableRoute) {
    // If the route has no polyline, fetch full details
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

  // ── Paste URL handler ───────────────────────────────────────────────────

  async function handlePasteUrlBlur() {
    const url = pasteUrlRef.current?.value?.trim();
    if (!url) return;

    dispatch({ type: 'SET_FIELD', field: 'fetchRouteError', value: null });
    const parsed = parseRouteUrl(url);

    // Always store the URL
    dispatch({ type: 'SET_FIELD', field: 'routeUrl', value: url });

    // Unrecognized service — try scraping
    if (!parsed) {
      dispatch({ type: 'SET_FIELD', field: 'isFetchingRoute', value: true });
      try {
        const res = await fetch(`${routes.scrapeRoute}?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.route) {
            await applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            return;
          }
        }
      } catch {
        // Scrape failed — store as link-only
      }
      dispatch({ type: 'SET_LINK_ONLY', routeName: form.routeLinkAdded });
      return;
    }

    // No connection for this service — try scraping
    if (!connectedServices.includes(parsed.service)) {
      dispatch({ type: 'SET_FIELD', field: 'detectedService', value: parsed.service });
      dispatch({ type: 'SET_FIELD', field: 'isFetchingRoute', value: true });
      try {
        const res = await fetch(`${routes.scrapeRoute}?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.route) {
            await applyRouteData(data.route as ImportableRoute);
            toast.success(appContent.rides.importRoute.imported);
            return;
          }
        }
      } catch {
        // Scrape failed
      }
      dispatch({
        type: 'SET_LINK_ONLY',
        routeName: form.routeLinkAdded,
        detectedService: parsed.service,
      });
      return;
    }

    // Connected — fetch via API
    dispatch({ type: 'SET_FIELD', field: 'isFetchingRoute', value: true });
    try {
      const res = await fetch(
        `${routes.importRouteById(parsed.id)}?service=${parsed.service}&type=${parsed.type}`,
      );
      if (!res.ok) {
        dispatch({ type: 'SET_FIELD', field: 'fetchRouteError', value: form.fetchRouteError });
        dispatch({ type: 'SET_LINK_ONLY', routeName: form.routeLinkAdded });
        return;
      }
      const data = await res.json();
      if (data.route) {
        await applyRouteData(data.route as ImportableRoute);
        toast.success(appContent.rides.importRoute.imported);
      }
    } catch {
      dispatch({ type: 'SET_FIELD', field: 'fetchRouteError', value: form.fetchRouteError });
      dispatch({ type: 'SET_LINK_ONLY', routeName: form.routeLinkAdded });
    }
  }

  // ── Clear route data ────────────────────────────────────────────────────

  function clearRouteData(preserveUrl = false) {
    dispatch({ type: 'CLEAR_ROUTE_DATA', preserveUrl });
  }

  // ── Form submission ─────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    dispatch({ type: 'SET_PENDING', value: true });
    dispatch({ type: 'SET_ERROR', value: null });

    const errors: Record<string, string> = {};
    if (!state.routeUrl) errors.routeUrl = form.fieldRequired;
    if (!state.title) errors.title = form.fieldRequired;
    if (!state.rideDate) errors.rideDate = form.fieldRequired;
    if (!state.startTime) errors.startTime = form.fieldRequired;
    if (!state.paceGroupId) errors.paceGroupId = form.fieldRequired;
    if (!state.capacity) errors.capacity = form.fieldRequired;

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_FIELD_ERRORS', errors });
      dispatch({ type: 'SET_PENDING', value: false });
      // Scroll to first errored field
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    const shared = {
      title: state.title,
      description: state.description || undefined,
      ride_date: state.rideDate,
      start_time: state.startTime,
      pace_group_id: state.paceGroupId,
      distance_km: state.distanceKm ? Number(state.distanceKm) : undefined,
      elevation_m: state.elevationM ? Number(state.elevationM) : undefined,
      capacity: Number(state.capacity),
      route_url: state.routeUrl,
      route_name: state.routeName || undefined,
      route_polyline: state.routePolyline || undefined,
      is_drop_ride: state.isDropRide,
      start_location_name: state.startLocationName || undefined,
      start_location_address: state.startLocationAddress || undefined,
      start_latitude: state.startLatitude ?? undefined,
      start_longitude: state.startLongitude ?? undefined,
    };

    let result: { error?: string; success?: boolean; rideId?: string };

    if (isEdit && state.editScope === 'all' && isRecurringSeries) {
      result = await updateRecurringSeries(rideId!, {
        ...shared,
        co_leader_ids: state.selectedCoLeaders,
      } as UpdateRideData);
    } else if (isEdit) {
      result = await updateRide(rideId!, {
        ...shared,
        co_leader_ids: state.selectedCoLeaders,
      } as UpdateRideData);
    } else {
      // Read recurring fields from FormData since they use native selects with defaultValue
      const fd = new FormData(e.currentTarget);
      const recurrence = fd.get('recurrence') as string;
      let recurring: CreateRideData['recurring'] = undefined;
      if (state.isRecurring && recurrence) {
        const [y, m, d] = state.rideDate.split('-').map(Number);
        recurring = {
          recurrence,
          day_of_week: new Date(y, m - 1, d).getDay(),
          end_after_occurrences:
            state.recurringEndType === 'after' && fd.get('end_after')
              ? Number(fd.get('end_after'))
              : undefined,
          end_date:
            state.recurringEndType === 'on_date'
              ? (fd.get('end_date') as string) || undefined
              : undefined,
        };
      }

      result = await createRide({
        ...shared,
        club_id: clubId,
        recurring,
        co_leader_ids: state.selectedCoLeaders.length > 0 ? state.selectedCoLeaders : undefined,
      } as CreateRideData);
    }

    dispatch({ type: 'SET_PENDING', value: false });

    if (result.error) {
      dispatch({ type: 'SET_ERROR', value: result.error });
    } else {
      if (!isEdit && result.rideId) {
        router.push(routes.ride(result.rideId));
      } else {
        router.push(returnTo && returnTo.startsWith('/') ? returnTo : routes.manage);
      }
    }
  }

  // ── Convenience field setter ────────────────────────────────────────────

  function setField<K extends keyof RideFormState>(field: K, value: RideFormState[K]) {
    dispatch({ type: 'SET_FIELD', field, value: value as RideFormState[keyof RideFormState] });
  }

  return {
    state,
    dispatch,
    setField,
    pasteUrlRef,

    // Derived
    isEdit,
    isRecurringSeries,

    // Handlers
    handleRouteImport,
    handlePasteUrlBlur,
    handleSubmit,
    clearRouteData,
    applyRouteData,
  };
}
