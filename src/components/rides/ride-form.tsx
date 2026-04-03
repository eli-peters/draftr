'use client';

import { Button } from '@/components/ui/button';
import { CancelRideButton } from '@/components/rides/cancel-ride-button';
import { appContent } from '@/content/app';
import { todayDateString } from '@/config/formatting';
import { useRideFormState } from '@/hooks/use-ride-form-state';
import {
  StepRoute,
  StepDetails,
  StepWhenWhere,
  StepCoLeaders,
} from '@/components/rides/form-steps';
import type { IntegrationService } from '@/types/database';
import type { RideFormInitialData } from '@/types/rides';

const { rides: ridesContent, common } = appContent;

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
  rideTitle?: string;
  returnTo?: string;
  /** Content rendered inside the Co-Leaders step in edit mode (e.g. signups roster) */
  children?: React.ReactNode;
  /** Number of confirmed signups for the edit-mode roster heading */
  signupCount?: number;
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
  rideTitle,
  returnTo,
  children,
  signupCount,
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
        />

        {/* ── Step 3: When & Where ─────────────────────────────────── */}
        <StepWhenWhere
          rideDate={state.rideDate}
          startTime={state.startTime}
          dateMin={effectiveMin}
          dateMax={seasonEnd || undefined}
          fieldErrors={state.fieldErrors}
          onDateChange={(v) => setField('rideDate', v)}
          onTimeChange={(v) => setField('startTime', v)}
        />

        {/* ── Step 4: Co-Leaders ────────────────────────────────────── */}
        <StepCoLeaders
          isEdit={isEdit}
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
          signupCount={signupCount}
        >
          {children}
        </StepCoLeaders>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div>
          {state.error && <p className="text-sm text-destructive mb-4">{state.error}</p>}
          <div className="flex flex-col-reverse items-center gap-3 md:flex-row">
            {isEdit && rideId && rideTitle && (
              <div className="md:mr-auto w-full md:w-auto">
                <CancelRideButton rideId={rideId} rideTitle={rideTitle} />
              </div>
            )}
            <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto justify-center md:justify-end">
              <button
                type="button"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => history.back()}
              >
                {isEdit ? common.discard : common.cancel}
              </button>
              <Button type="submit" disabled={state.isPending} className="w-full md:w-auto">
                {state.isPending
                  ? common.loading
                  : isEdit
                    ? common.save
                    : ridesContent.create.submitButton}
              </Button>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
