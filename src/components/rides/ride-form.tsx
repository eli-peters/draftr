'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowsClockwise, MapTrifold } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import {
  createRide,
  updateRide,
  updateRecurringSeries,
  type CreateRideData,
  type UpdateRideData,
} from '@/lib/rides/actions';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const { rides: ridesContent, common, manage: manageContent } = appContent;
const form = ridesContent.form;
const rc = manageContent.recurringRides;

interface RideFormInitialData {
  title: string;
  description: string;
  ride_date: string;
  start_time: string;
  meeting_location_id: string;
  pace_group_id: string;
  distance_km: string;
  elevation_m: string;
  capacity: string;
  route_name: string;
  route_url: string;
  route_polyline: string;
  is_drop_ride: boolean;
}

interface RideFormProps {
  clubId: string;
  meetingLocations: { id: string; name: string }[];
  paceGroups: { id: string; name: string }[];
  rideId?: string;
  templateId?: string;
  initialData?: RideFormInitialData;
  seasonStart?: string;
  seasonEnd?: string;
  connectedServices?: IntegrationService[];
  returnTo?: string;
}

export function RideForm({
  clubId,
  meetingLocations,
  paceGroups,
  rideId,
  templateId,
  initialData,
  seasonStart,
  seasonEnd,
  connectedServices = [],
  returnTo,
}: RideFormProps) {
  const router = useRouter();
  const isEdit = !!rideId;
  const isRecurringSeries = isEdit && !!templateId;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [editScope, setEditScope] = useState<'this' | 'all'>('this');
  const [importOpen, setImportOpen] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<string>(initialData?.route_polyline ?? '');

  // Refs for setting uncontrolled input values on import
  const titleRef = useRef<HTMLInputElement>(null);
  const routeNameRef = useRef<HTMLInputElement>(null);
  const routeUrlRef = useRef<HTMLInputElement>(null);
  const distanceRef = useRef<HTMLInputElement>(null);
  const elevationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function handleRouteImport(route: ImportableRoute) {
    // Only set title if currently empty
    if (titleRef.current && !titleRef.current.value) {
      titleRef.current.value = route.name;
    }
    if (routeNameRef.current) {
      routeNameRef.current.value = route.name;
    }
    if (routeUrlRef.current) {
      routeUrlRef.current.value = route.source_url;
    }
    if (distanceRef.current) {
      distanceRef.current.value = (route.distance_m / 1000).toFixed(1);
    }
    if (elevationRef.current) {
      elevationRef.current.value = String(Math.round(route.elevation_m));
    }
    // Only set description if currently empty
    if (descriptionRef.current && !descriptionRef.current.value && route.description) {
      descriptionRef.current.value = route.description;
    }
    if (route.polyline) {
      setRoutePolyline(route.polyline);
    }
    setImportOpen(false);
    toast.success(appContent.rides.importRoute.imported);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const ride_date = fd.get('ride_date') as string;
    const start_time = fd.get('start_time') as string;

    if (!title || !ride_date || !start_time) {
      setError(form.required);
      setIsPending(false);
      return;
    }

    const shared = {
      title,
      description: (fd.get('description') as string) || undefined,
      ride_date,
      start_time,
      meeting_location_id: (fd.get('meeting_location_id') as string) || undefined,
      pace_group_id: (fd.get('pace_group_id') as string) || undefined,
      distance_km: fd.get('distance_km') ? Number(fd.get('distance_km')) : undefined,
      elevation_m: fd.get('elevation_m') ? Number(fd.get('elevation_m')) : undefined,
      capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
      route_url: (fd.get('route_url') as string) || undefined,
      route_name: (fd.get('route_name') as string) || undefined,
      route_polyline: (fd.get('route_polyline') as string) || undefined,
      is_drop_ride: fd.get('is_drop_ride') === 'on',
    };

    let result: { error?: string; success?: boolean };

    if (isEdit && editScope === 'all' && isRecurringSeries) {
      result = await updateRecurringSeries(rideId, shared as UpdateRideData);
    } else if (isEdit) {
      result = await updateRide(rideId, shared as UpdateRideData);
    } else {
      // Build recurring options if toggle is on
      const recurrence = fd.get('recurrence') as string;
      let recurring: CreateRideData['recurring'] = undefined;
      if (isRecurring && recurrence) {
        // Timezone-safe day-of-week: parse YYYY-MM-DD as local date
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

      result = await createRide({ ...shared, club_id: clubId, recurring } as CreateRideData);
    }

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(returnTo && returnTo.startsWith('/') ? returnTo : routes.manage);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Recurring series edit prompt */}
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

      <div className="space-y-2">
        <Label htmlFor="title">{form.title} *</Label>
        <Input ref={titleRef} id="title" name="title" required defaultValue={initialData?.title} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ride_date">{form.date} *</Label>
          <Input
            id="ride_date"
            name="ride_date"
            type="date"
            required
            defaultValue={initialData?.ride_date}
            min={seasonStart || undefined}
            max={seasonEnd || undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">{form.startTime} *</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue={initialData?.start_time}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting_location_id">{form.meetingLocation}</Label>
          <Select
            id="meeting_location_id"
            name="meeting_location_id"
            defaultValue={initialData?.meeting_location_id}
          >
            <option value="">{form.selectLocation}</option>
            {meetingLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace_group_id">{form.paceGroup}</Label>
          <Select id="pace_group_id" name="pace_group_id" defaultValue={initialData?.pace_group_id}>
            <option value="">{form.selectPace}</option>
            {paceGroups.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance_km">{form.distance}</Label>
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
        <div className="space-y-2">
          <Label htmlFor="elevation_m">{form.elevation}</Label>
          <Input
            ref={elevationRef}
            id="elevation_m"
            name="elevation_m"
            type="number"
            min="0"
            defaultValue={initialData?.elevation_m}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">{form.capacity}</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            defaultValue={initialData?.capacity}
          />
        </div>
      </div>

      {/* Route section — import button + fields */}
      <div className="space-y-3">
        {connectedServices.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <MapTrifold className="mr-1.5 size-4" />
            {appContent.rides.importRoute.button}
          </Button>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="route_name">{form.routeName}</Label>
            <Input
              ref={routeNameRef}
              id="route_name"
              name="route_name"
              defaultValue={initialData?.route_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="route_url">{form.routeLink}</Label>
            <Input
              ref={routeUrlRef}
              id="route_url"
              name="route_url"
              type="url"
              defaultValue={initialData?.route_url}
            />
          </div>
        </div>
        <input type="hidden" name="route_polyline" value={routePolyline} />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_drop_ride"
          name="is_drop_ride"
          type="checkbox"
          defaultChecked={initialData?.is_drop_ride}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="is_drop_ride" className="cursor-pointer">
          {form.isDropRide}
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{form.description}</Label>
        <Textarea
          ref={descriptionRef}
          id="description"
          name="description"
          rows={2}
          defaultValue={initialData?.description}
          placeholder={form.descriptionPlaceholder}
        />
      </div>

      {/* Recurring ride toggle — only for new rides */}
      {!isEdit && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="is_recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="is_recurring" className="cursor-pointer flex items-center gap-2">
              <ArrowsClockwise className="h-4 w-4 text-muted-foreground" />
              {ridesContent.recurring.toggle}
            </Label>
          </div>
          {isRecurring && (
            <div className="space-y-4 pl-7">
              <div className="space-y-2">
                <Label htmlFor="recurrence">{ridesContent.recurring.frequency}</Label>
                <Select id="recurrence" name="recurrence" defaultValue="weekly">
                  <option value="weekly">{rc.recurrence.weekly}</option>
                  <option value="biweekly">{rc.recurrence.biweekly}</option>
                  <option value="monthly">{rc.recurrence.monthly}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{ridesContent.recurring.endCondition}</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="recurring_end_type"
                      value="never"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    {ridesContent.recurring.endNever}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="recurring_end_type"
                      value="after"
                      className="h-4 w-4"
                    />
                    {ridesContent.recurring.endAfter}
                    <Input
                      name="end_after"
                      type="number"
                      min="1"
                      max="52"
                      defaultValue="10"
                      className="w-20 h-8"
                    />
                    {ridesContent.recurring.occurrences}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="recurring_end_type"
                      value="on_date"
                      className="h-4 w-4"
                    />
                    {ridesContent.recurring.endOnDate}
                    <Input
                      name="end_date"
                      type="date"
                      className="w-auto h-8"
                      min={seasonStart || undefined}
                      max={seasonEnd || undefined}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {common.cancel}
        </Button>
      </div>

      {connectedServices.length > 0 && (
        <RouteImportDrawer
          open={importOpen}
          onOpenChange={setImportOpen}
          connectedServices={connectedServices}
          onSelect={handleRouteImport}
        />
      )}
    </form>
  );
}
