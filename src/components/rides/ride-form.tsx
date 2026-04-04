'use client';

import { RideFormActionBar } from '@/components/rides/ride-form-action-bar';
import { todayDateString } from '@/config/formatting';
import { useRideFormState } from '@/hooks/use-ride-form-state';
import { StepRoute, StepDetails, StepCoLeaders } from '@/components/rides/form-steps';
import type { IntegrationService } from '@/types/database';
import type { RideFormInitialData } from '@/types/rides';

interface RideFormProps {
  clubId: string;
  paceGroups: { id: string; name: string }[];
  rideId?: string;
  initialData?: RideFormInitialData;
  seasonStart?: string;
  seasonEnd?: string;
  connectedServices?: IntegrationService[];
  eligibleLeaders?: { user_id: string; name: string; avatar_url: string | null }[];
  initialCoLeaderIds?: string[];
  returnTo?: string;
}

export function RideForm({
  clubId,
  paceGroups,
  rideId,
  initialData,
  seasonStart,
  seasonEnd,
  connectedServices = [],
  eligibleLeaders = [],
  initialCoLeaderIds,
  returnTo,
}: RideFormProps) {
  const today = todayDateString();
  const effectiveMin = seasonStart && seasonStart > today ? seasonStart : today;

  const {
    state,
    setField,
    pasteUrlRef,
    isEdit,
    handleRouteImport,
    handlePasteUrlBlur,
    handleSubmit,
    clearRouteData,
  } = useRideFormState({
    initialData,
    rideId,
    clubId,
    connectedServices,
    eligibleLeaders,
    initialCoLeaderIds,
    returnTo,
  });

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={state.isFetchingRoute} className="min-w-0 space-y-5">
        {/* ── Step 1: Route ────────────────────────────────────────── */}
        <div>
          <StepRoute
            importedRouteName={state.importedRouteName}
            routePolyline={state.routePolyline}
            routeUrl={state.routeUrl}
            detectedService={state.detectedService}
            connectedServices={connectedServices}
            onSelectRoute={handleRouteImport}
            onClearRoute={clearRouteData}
            pasteUrlRef={pasteUrlRef}
            isFetchingRoute={state.isFetchingRoute}
            fetchRouteError={state.fetchRouteError}
            onPasteUrl={handlePasteUrlBlur}
            routeError={state.fieldErrors.routeUrl}
            distanceKm={state.distanceKm}
            elevationM={state.elevationM}
            startLocationName={state.startLocationName}
            startLocationAddress={state.startLocationAddress}
            startLatitude={state.startLatitude}
            startLongitude={state.startLongitude}
            isGeocodingLocation={state.isGeocodingLocation}
          />
        </div>

        {/* ── Step 2: Ride Details ─────────────────────────────────── */}
        <StepDetails
          title={state.title}
          description={state.description}
          capacity={state.capacity}
          paceGroupId={state.paceGroupId}
          isDropRide={state.isDropRide}
          paceGroups={paceGroups}
          fieldErrors={state.fieldErrors}
          onFieldChange={(field, value) => {
            if (typeof value === 'boolean') {
              setField(field as 'isDropRide', value);
            } else {
              setField(field as 'title' | 'description' | 'paceGroupId', value);
            }
          }}
          onCapacityChange={(v) => setField('capacity', v)}
          rideDate={state.rideDate}
          startTime={state.startTime}
          dateMin={effectiveMin}
          dateMax={seasonEnd || undefined}
          onDateChange={(v) => setField('rideDate', v)}
          onTimeChange={(v) => setField('startTime', v)}
        />

        {/* ── Step 3: Co-Leaders ────────────────────────────────────── */}
        <StepCoLeaders
          eligibleLeaders={eligibleLeaders}
          selectedCoLeaders={state.selectedCoLeaders}
          coLeaderConflicts={state.coLeaderConflicts}
          onToggleCoLeader={(userId) =>
            setField(
              'selectedCoLeaders',
              state.selectedCoLeaders.includes(userId)
                ? state.selectedCoLeaders.filter((id) => id !== userId)
                : [...state.selectedCoLeaders, userId],
            )
          }
        />
      </fieldset>

      {/* ── Action Bar — outside fieldset, matches ride-detail pattern ── */}
      <div className="h-24 md:h-0" />
      <RideFormActionBar isEdit={isEdit} isPending={state.isPending} error={state.error} />
    </form>
  );
}
