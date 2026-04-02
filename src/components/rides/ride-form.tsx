'use client';

import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { CancelRideButton } from '@/components/rides/cancel-ride-button';
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
import type { RideFormInitialData } from '@/types/rides';

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
  initialCoLeaderIds?: string[];
  rideTitle?: string;
  returnTo?: string;
  /** Content rendered after form steps but before actions (e.g. signups roster on edit) */
  children?: React.ReactNode;
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
  initialCoLeaderIds,
  rideTitle,
  returnTo,
  children,
}: RideFormProps) {
  const today = todayDateString();
  const effectiveMin = seasonStart && seasonStart > today ? seasonStart : today;

  const {
    state,
    setField,
    pasteUrlRef,
    isEdit,
    isRecurringSeries,
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
    initialCoLeaderIds,
    returnTo,
  });

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <fieldset disabled={state.isFetchingRoute} className="min-w-0 space-y-5">
        {/* ── Recurring series edit prompt (edit-only) ──────────────── */}
        {isRecurringSeries && (
          <div className="rounded-xl border border-primary/20 bg-action-primary-subtle-bg p-4 space-y-3">
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
            routeError={state.fieldErrors.routeUrl}
            startLocationName={state.startLocationName}
            startLocationAddress={state.startLocationAddress}
            startLatitude={state.startLatitude}
            startLongitude={state.startLongitude}
            isGeocodingLocation={state.isGeocodingLocation}
          />
        </div>

        {/* ── Step 2: Details ──────────────────────────────────────── */}
        <StepDetails
          title={state.title}
          description={state.description}
          distanceKm={state.distanceKm}
          elevationM={state.elevationM}
          capacity={state.capacity}
          paceGroupId={state.paceGroupId}
          isDropRide={state.isDropRide}
          paceGroups={paceGroups}
          fieldErrors={state.fieldErrors}
          onFieldChange={(field, value) => {
            setField(field as keyof typeof state, value as never);
          }}
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

        {/* ── Step 4: Additional ───────────────────────────────────── */}
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

        {/* ── Edit-only sections (signups, etc.) ─────────────────── */}
        {children}

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
