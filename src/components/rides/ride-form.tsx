'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowsClockwise,
  MapTrifold,
  CheckCircle,
  ArrowRight,
  LinkSimple,
} from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SectionHeading } from '@/components/ui/section-heading';
import { Separator } from '@/components/ui/separator';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { todayDateString } from '@/config/formatting';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
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

function OptionalTag() {
  return <span className="text-xs font-normal text-muted-foreground ml-1">{form.optional}</span>;
}

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
  const today = todayDateString();
  const effectiveMin = seasonStart && seasonStart > today ? seasonStart : today;

  // Form state
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
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

  // Paste URL input for non-connected leaders
  const pasteUrlRef = useRef<HTMLInputElement>(null);

  // Refs for setting uncontrolled input values on import
  const titleRef = useRef<HTMLInputElement>(null);
  const distanceRef = useRef<HTMLInputElement>(null);
  const elevationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function applyRouteData(route: ImportableRoute) {
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
    if (route.polyline) {
      setRoutePolyline(route.polyline);
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

    if (!parsed) return;

    // If the leader has a connected account for this service, fetch route data
    if (!connectedServices.includes(parsed.service)) {
      // No connection — URL stored as link-only, that's fine
      setImportedRouteName(form.routeLinkAdded);
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
    const meeting_location_id = fd.get('meeting_location_id') as string;
    const pace_group_id = fd.get('pace_group_id') as string;
    const capacity = fd.get('capacity') as string;

    if (
      !title ||
      !ride_date ||
      !start_time ||
      !meeting_location_id ||
      !pace_group_id ||
      !capacity
    ) {
      setError(form.required);
      setIsPending(false);
      return;
    }

    const shared = {
      title,
      description: (fd.get('description') as string) || undefined,
      ride_date,
      start_time,
      meeting_location_id,
      pace_group_id,
      distance_km: fd.get('distance_km') ? Number(fd.get('distance_km')) : undefined,
      elevation_m: fd.get('elevation_m') ? Number(fd.get('elevation_m')) : undefined,
      capacity: Number(capacity),
      route_url: routeUrl || undefined,
      route_name: routeName || undefined,
      route_polyline: routePolyline || undefined,
      is_drop_ride: fd.get('is_drop_ride') === 'on',
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
    <form onSubmit={handleSubmit} className="mt-8">
      {/* Hidden inputs for route data managed via state */}
      <input type="hidden" name="route_polyline" value={routePolyline} />

      {/* ── Recurring series edit prompt (edit-only) ──────────────── */}
      {isRecurringSeries && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 mb-8">
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

      {/* ── Zone 0: Route ────────────────────────────────────────── */}
      {importedRouteName ? (
        /* Confirmed state — route has been imported or link pasted */
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="size-4 shrink-0 text-primary" weight="fill" />
            <p className="text-sm text-foreground truncate">
              {form.importConfirmed(importedRouteName)}
            </p>
          </div>
          {connectedServices.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
              {form.importChange}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImportedRouteName(null);
                setRouteUrl('');
                setRouteName('');
                setRoutePolyline('');
              }}
            >
              {form.importChange}
            </Button>
          )}
        </div>
      ) : connectedServices.length > 0 ? (
        /* Connected — show import drawer CTA */
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 flex flex-col items-center gap-3 text-center mb-8">
          <MapTrifold className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">{form.importHeading}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{form.importDescription}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <MapTrifold className="mr-1.5 size-4" />
            {appContent.rides.importRoute.button}
          </Button>
        </div>
      ) : (
        /* Not connected — connect prompt + paste URL */
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 mb-8">
          <Link href={routes.profileEdit} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <MapTrifold className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{form.connectPrompt}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="paste_route_url" className="flex items-center gap-1.5">
              <LinkSimple className="size-3.5 text-muted-foreground" />
              {form.pasteRouteLink}
            </Label>
            <Input
              ref={pasteUrlRef}
              id="paste_route_url"
              type="url"
              placeholder={form.pasteRoutePlaceholder}
              onBlur={handlePasteUrlBlur}
            />
            {isFetchingRoute && (
              <p className="text-xs text-muted-foreground">{form.fetchingRoute}</p>
            )}
            {fetchRouteError && <p className="text-xs text-destructive">{fetchRouteError}</p>}
          </div>
        </div>
      )}

      {/* ── Zone 1: When ─────────────────────────────────────────── */}
      <section>
        <SectionHeading className="mb-4">{form.sectionWhen}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ride_date">{form.date}</Label>
            <Input
              id="ride_date"
              name="ride_date"
              type="date"
              required
              defaultValue={initialData?.ride_date}
              min={effectiveMin}
              max={seasonEnd || undefined}
            />
            <p className="text-xs text-muted-foreground">
              {seasonStart && seasonEnd
                ? form.dateHelper(seasonStart, seasonEnd)
                : form.dateHelperNoSeason}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_time">{form.startTime}</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              step="900"
              required
              defaultValue={initialData?.start_time}
            />
          </div>
        </div>
      </section>

      {/* ── Zone 2: Where ────────────────────────────────────────── */}
      <section className="mt-8">
        <SectionHeading className="mb-4">{form.sectionWhere}</SectionHeading>
        <div className="space-y-2">
          <Label htmlFor="meeting_location_id">{form.meetingLocation}</Label>
          <Select
            id="meeting_location_id"
            name="meeting_location_id"
            required
            defaultValue={initialData?.meeting_location_id}
          >
            <option value="" disabled>
              {form.selectLocation}
            </option>
            {meetingLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <Separator className="mt-8" />

      {/* ── Zone 3: Ride Type ────────────────────────────────────── */}
      <section className="mt-8">
        <SectionHeading className="mb-4">{form.sectionRideType}</SectionHeading>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pace_group_id">{form.paceGroup}</Label>
            <Select
              id="pace_group_id"
              name="pace_group_id"
              required
              defaultValue={initialData?.pace_group_id}
            >
              <option value="" disabled>
                {form.selectPace}
              </option>
              {paceGroups.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_drop_ride">{form.isDropRide}</Label>
            <Switch id="is_drop_ride" checked={isDropRide} onCheckedChange={setIsDropRide} />
            <input type="hidden" name="is_drop_ride" value={isDropRide ? 'on' : ''} />
          </div>
        </div>
      </section>

      {/* ── Zone 4: Route Stats ──────────────────────────────────── */}
      <section className="mt-8">
        <SectionHeading className="mb-4">{form.sectionRouteStats}</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="distance_km">
              {form.distance}
              <OptionalTag />
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
          <div className="space-y-2">
            <Label htmlFor="elevation_m">
              {form.elevation}
              <OptionalTag />
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
          <div className="space-y-2">
            <Label htmlFor="capacity">{form.capacity}</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              required
              defaultValue={initialData?.capacity}
            />
          </div>
        </div>
      </section>

      <Separator className="mt-8" />

      {/* ── Zone 5: Details ──────────────────────────────────────── */}
      <section className="mt-8">
        <SectionHeading className="mb-4">{form.sectionDetails}</SectionHeading>
        <div className="space-y-4">
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
        </div>
      </section>

      {/* ── Zone 6: Schedule (create-only) ───────────────────────── */}
      {!isEdit && (
        <section className="mt-8">
          <SectionHeading className="mb-4">{form.sectionSchedule}</SectionHeading>
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_recurring" className="flex items-center gap-2 cursor-pointer">
                <ArrowsClockwise className="h-4 w-4 text-muted-foreground" />
                {ridesContent.recurring.toggle}
              </Label>
              <Switch id="is_recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="space-y-4 pt-2">
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
                  <div className="space-y-3">
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
        </section>
      )}

      {/* ── Zone 7: Actions ──────────────────────────────────────── */}
      <div className="mt-8">
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {common.cancel}
          </Button>
        </div>
      </div>

      {/* Route import drawer — always rendered for connected services */}
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
