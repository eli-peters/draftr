'use client';

import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { LocationPickerDrawer } from '@/components/rides/location-picker-drawer';
import { appContent } from '@/content/app';
import { todayDateString } from '@/config/formatting';
import { useRideFormState } from '@/hooks/use-ride-form-state';
import {
  StepRoute,
  StepDetails,
  StepWhenWhere,
  StepAdditional,
} from '@/components/rides/form-steps';
import type { IntegrationService } from '@/types/database';
import type { MeetingLocation, RideFormInitialData } from '@/types/rides';

// Re-export for downstream consumers
export type { MeetingLocation } from '@/types/rides';

const { rides: ridesContent, common } = appContent;

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
  const today = todayDateString();
  const effectiveMin = seasonStart && seasonStart > today ? seasonStart : today;

  const {
    state,
    setField,
    pasteUrlRef,
    isEdit,
    isRecurringSeries,
    isRouteComplete,
    isDetailsComplete,
    isWhenWhereComplete,
    hasInitialData,
    handleRouteImport,
    handlePasteUrlBlur,
    handleSubmit,
    clearRouteData,
  } = useRideFormState({
    initialData,
    rideId,
    templateId,
    clubId,
    connectedServices,
    eligibleLeaders,
    returnTo,
  });

  // ── Progressive disclosure — which steps are visible ────────────────────
  const bypassDisclosure = isEdit || hasInitialData;
  const showDetails = bypassDisclosure || isRouteComplete;
  const showWhenWhere = bypassDisclosure || (isRouteComplete && isDetailsComplete);
  const showAdditional =
    bypassDisclosure || (isRouteComplete && isDetailsComplete && isWhenWhereComplete);

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <fieldset disabled={state.isFetchingRoute} className="min-w-0 space-y-5">
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
                variant={state.editScope === 'this' ? 'default' : 'outline'}
                onClick={() => setField('editScope', 'this')}
              >
                {ridesContent.edit.editThisOnly}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={state.editScope === 'all' ? 'default' : 'outline'}
                onClick={() => setField('editScope', 'all')}
              >
                {ridesContent.edit.editAllFuture}
              </Button>
            </div>
          </div>
        )}

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
          />
        </div>

        {/* ── Step 2: Details ──────────────────────────────────────── */}
        {showDetails && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <StepDetails
              title={state.title}
              description={state.description}
              distanceKm={state.distanceKm}
              elevationM={state.elevationM}
              capacity={state.capacity}
              paceGroupId={state.paceGroupId}
              isDropRide={state.isDropRide}
              paceGroups={paceGroups}
              onFieldChange={(field, value) => {
                setField(field as keyof typeof state, value as never);
              }}
            />
          </div>
        )}

        {/* ── Step 3: When & Where ─────────────────────────────────── */}
        {showWhenWhere && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <StepWhenWhere
              rideDate={state.rideDate}
              startTime={state.startTime}
              startLocationName={state.startLocationName}
              startLocationAddress={state.startLocationAddress}
              startLatitude={state.startLatitude}
              startLongitude={state.startLongitude}
              isGeocodingLocation={state.isGeocodingLocation}
              routeUrl={state.routeUrl}
              dateMin={effectiveMin}
              dateMax={seasonEnd || undefined}
              meetingLocations={meetingLocations}
              onDateChange={(v) => setField('rideDate', v)}
              onTimeChange={(v) => setField('startTime', v)}
              onOpenLocationPicker={() => setField('locationPickerOpen', true)}
              onSelectSavedLocation={(loc) => {
                setField('startLocationName', loc.name);
                setField('startLocationAddress', loc.address ?? '');
                setField('startLatitude', loc.latitude ?? null);
                setField('startLongitude', loc.longitude ?? null);
              }}
            />
          </div>
        )}

        {/* ── Step 4: Additional ───────────────────────────────────── */}
        {showAdditional && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <StepAdditional
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
              isRecurring={state.isRecurring}
              onRecurringChange={(v) => setField('isRecurring', v)}
              recurringEndType={state.recurringEndType}
              onEndTypeChange={(v) => setField('recurringEndType', v)}
              recurringEndDate={state.recurringEndDate}
              onEndDateChange={(v) => setField('recurringEndDate', v)}
              seasonStart={seasonStart}
              seasonEnd={seasonEnd}
            />
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────── */}
        {showAdditional && (
          <div className="animate-in fade-in-0 duration-200">
            {state.error && <p className="text-sm text-destructive mb-4">{state.error}</p>}
            <div className="flex flex-col-reverse items-center gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => history.back()}
              >
                {common.cancel}
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
        )}

        {/* Location picker drawer */}
        <LocationPickerDrawer
          open={state.locationPickerOpen}
          onOpenChange={(v) => setField('locationPickerOpen', v)}
          meetingLocations={meetingLocations}
          clubId={clubId}
          onConfirm={(location) => {
            setField('startLocationName', location.name);
            setField('startLocationAddress', location.address ?? '');
            setField('startLatitude', location.latitude ?? null);
            setField('startLongitude', location.longitude ?? null);
            setField('locationPickerOpen', false);
          }}
        />
      </fieldset>
    </form>
  );
}
