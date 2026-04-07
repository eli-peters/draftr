'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { SectionHeading } from '@/components/ui/section-heading';
import { Switch } from '@/components/ui/switch';
import { DrawerBody, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { AdminFilterToolbar, type FilterDefinition } from './admin-filter-toolbar';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';
import {
  createRecurringRide,
  deleteRecurringRide,
  toggleRecurringRide,
  generateRidesFromRecurring,
} from '@/lib/manage/actions';

const { manage: content, rides: ridesContent } = appContent;
const rc = content.recurringRides;
const form = ridesContent.form;

interface RecurringRideData {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number | null;
  start_time: string;
  is_drop_ride: boolean;
  is_active: boolean;
  recurrence: string | null;
  season_start_date: string | null;
  season_end_date: string | null;
  default_distance_km: number | null;
  default_capacity: number | null;
  start_location_name: string | null;
  pace_group_name: string | null;
}

interface RecurringRidesPanelProps {
  recurringRides: RecurringRideData[];
  clubId: string;
  paceGroups: { id: string; name: string }[];
}

function formatSeason(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return rc.yearRound;
  const fmt = (d: string) => format(new Date(d), 'MMM d');
  if (startDate && endDate) return `${fmt(startDate)} → ${fmt(endDate)}`;
  if (startDate) return `${fmt(startDate)} →`;
  return `→ ${fmt(endDate!)}`;
}

export function RecurringRidesPanel({
  recurringRides,
  clubId,
  paceGroups,
}: RecurringRidesPanelProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [rcStartTime, setRcStartTime] = useState('');
  const [rcSeasonStart, setRcSeasonStart] = useState('');
  const [rcSeasonEnd, setRcSeasonEnd] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visibleRides = useMemo(() => {
    let filtered = recurringRides;
    if (statusFilter === 'active') filtered = filtered.filter((r) => r.is_active);
    if (statusFilter === 'paused') filtered = filtered.filter((r) => !r.is_active);
    if (dayFilter !== 'all') {
      filtered = filtered.filter((r) => r.day_of_week === Number(dayFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }
    return filtered;
  }, [recurringRides, statusFilter, dayFilter, search]);

  const statusFilterDef: FilterDefinition = {
    key: 'status',
    label: rc.filterStatus,
    defaultValue: 'all',
    options: [
      { value: 'all', label: rc.filterAll },
      { value: 'active', label: rc.active },
      { value: 'paused', label: rc.paused },
    ],
  };

  const dayFilterDef: FilterDefinition = {
    key: 'day',
    label: rc.filterDay,
    defaultValue: 'all',
    options: [
      { value: 'all', label: rc.filterAll },
      ...rc.dayOfWeek.map((day, i) => ({ value: String(i), label: day })),
    ],
  };

  const filterValues: Record<string, string> = { status: statusFilter, day: dayFilter };

  function handleFilterChange(key: string, value: string) {
    if (key === 'status') setStatusFilter(value);
    if (key === 'day') setDayFilter(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const start_time = fd.get('start_time') as string;
    const day_of_week = fd.get('day_of_week') as string;
    const recurrence = fd.get('recurrence') as string;
    if (!title || !start_time || !day_of_week || !recurrence) return;

    startTransition(async () => {
      const result = await createRecurringRide(clubId, {
        title,
        start_time,
        day_of_week: Number(day_of_week),
        recurrence,
        description: (fd.get('description') as string) || undefined,
        season_start_date: (fd.get('season_start_date') as string) || undefined,
        season_end_date: (fd.get('season_end_date') as string) || undefined,
        generate_weeks_ahead: fd.get('generate_weeks_ahead')
          ? Number(fd.get('generate_weeks_ahead'))
          : undefined,
        pace_group_id: (fd.get('pace_group_id') as string) || undefined,
        default_distance_km: fd.get('default_distance_km')
          ? Number(fd.get('default_distance_km'))
          : undefined,
        default_capacity: fd.get('default_capacity')
          ? Number(fd.get('default_capacity'))
          : undefined,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteRecurringRide(id);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      const result = await toggleRecurringRide(id, !currentlyActive);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleGenerate(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await generateRidesFromRecurring(id);
      if (result.count != null) {
        setMessage(rc.generated(result.count));
      }
    });
  }

  return (
    <div className={cn('space-y-3', isPending && 'opacity-pending pointer-events-none')}>
      <div className="flex items-center justify-between">
        <SectionHeading as="h3">{rc.heading}</SectionHeading>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {rc.createButton}
        </Button>
      </div>

      <AdminFilterToolbar
        filters={[statusFilterDef, dayFilterDef]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={rc.searchPlaceholder}
      />

      {message && <p className="text-sm text-success">{message}</p>}

      {visibleRides.length === 0 ? (
        <p className="font-mono text-body-sm text-(--text-secondary)">{rc.noRecurring}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-(--border-subtle)">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border-subtle) bg-(--surface-sunken)">
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.dayColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.timeColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.titleColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.paceColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.recurrenceColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.seasonColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.statusColumn}
                </th>
                <th className="p-3 text-overline font-mono text-(--text-secondary)">
                  {rc.actionsColumn}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRides.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'group border-b border-(--border-subtle) last:border-b-0 even:bg-(--surface-sunken) hover:bg-muted/50',
                    !r.is_active && 'opacity-muted',
                  )}
                >
                  <td className="p-3 font-mono text-body-sm text-(--text-primary)">
                    {r.day_of_week != null ? rc.dayOfWeek[r.day_of_week].slice(0, 3) : '—'}
                  </td>
                  <td className="p-3 font-mono text-body-sm text-(--text-primary)">
                    {r.start_time.slice(0, 5)}
                  </td>
                  <td className="p-3 font-mono text-body-sm font-semibold text-(--text-primary)">
                    {r.title}
                  </td>
                  <td className="p-3 font-mono text-body-sm text-(--text-primary)">
                    {r.pace_group_name ?? '—'}
                  </td>
                  <td className="p-3 font-mono text-body-sm text-(--text-primary)">
                    {r.recurrence ? rc.recurrence[r.recurrence as keyof typeof rc.recurrence] : '—'}
                  </td>
                  <td className="p-3 font-mono text-body-sm text-(--text-secondary)">
                    {formatSeason(r.season_start_date, r.season_end_date)}
                  </td>
                  <td className="p-3">
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={() => handleToggle(r.id, r.is_active)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleGenerate(r.id)}
                        className="text-muted-foreground/50 hover:text-primary"
                        title={rc.generateNow}
                      >
                        <ArrowClockwise className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(r.id)}
                        className="text-muted-foreground/50 hover:text-destructive"
                        title={rc.delete}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ResponsiveDrawer open={open} onOpenChange={setOpen} size="lg">
        <DrawerHeader>
          <DrawerTitle>{rc.create}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4 pt-2">
          <form id="recurring-ride-form" onSubmit={handleSubmit} className="space-y-4">
            <FloatingField label={`${form.title} *`} htmlFor="rc-title">
              <Input id="rc-title" name="title" required placeholder=" " />
            </FloatingField>
            <div className="grid grid-cols-3 gap-4">
              <FloatingField
                label={`${rc.dayOfWeek[0].slice(0, 3)}... *`}
                htmlFor="rc-day"
                hasValue={false}
              >
                <Select
                  name="day_of_week"
                  required
                  items={Object.fromEntries(rc.dayOfWeek.map((day, i) => [String(i), day]))}
                >
                  <SelectTrigger id="rc-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rc.dayOfWeek.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FloatingField>
              <FloatingField
                label={`${form.startTime} *`}
                htmlFor="rc-time"
                hasValue={!!rcStartTime}
              >
                <TimePicker
                  id="rc-time"
                  name="start_time"
                  value={rcStartTime}
                  onChange={setRcStartTime}
                  required
                />
              </FloatingField>
              <FloatingField
                label={`${rc.recurrence.weekly} *`}
                htmlFor="rc-recurrence"
                hasValue={true}
              >
                <Select
                  name="recurrence"
                  required
                  defaultValue="weekly"
                  items={{
                    weekly: rc.recurrence.weekly,
                    biweekly: rc.recurrence.biweekly,
                    monthly: rc.recurrence.monthly,
                  }}
                >
                  <SelectTrigger id="rc-recurrence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{rc.recurrence.weekly}</SelectItem>
                    <SelectItem value="biweekly">{rc.recurrence.biweekly}</SelectItem>
                    <SelectItem value="monthly">{rc.recurrence.monthly}</SelectItem>
                  </SelectContent>
                </Select>
              </FloatingField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FloatingField
                label={rc.seasonStartLabel}
                htmlFor="rc-season-start"
                hasValue={!!rcSeasonStart}
              >
                <DatePicker
                  id="rc-season-start"
                  name="season_start_date"
                  value={rcSeasonStart}
                  onChange={setRcSeasonStart}
                />
              </FloatingField>
              <FloatingField
                label={rc.seasonEndLabel}
                htmlFor="rc-season-end"
                hasValue={!!rcSeasonEnd}
              >
                <DatePicker
                  id="rc-season-end"
                  name="season_end_date"
                  value={rcSeasonEnd}
                  onChange={setRcSeasonEnd}
                />
              </FloatingField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FloatingField label={form.paceGroup} htmlFor="rc-pace" hasValue={false}>
                <Select
                  name="pace_group_id"
                  items={Object.fromEntries(paceGroups.map((pg) => [pg.id, pg.name]))}
                >
                  <SelectTrigger id="rc-pace">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paceGroups.map((pg) => (
                      <SelectItem key={pg.id} value={pg.id}>
                        {pg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FloatingField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FloatingField label={form.distance} htmlFor="rc-distance">
                <Input
                  id="rc-distance"
                  name="default_distance_km"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder=" "
                />
              </FloatingField>
              <FloatingField label={form.capacity} htmlFor="rc-capacity">
                <Input
                  id="rc-capacity"
                  name="default_capacity"
                  type="number"
                  min="1"
                  placeholder=" "
                />
              </FloatingField>
              <FloatingField label={rc.weeksAheadLabel} htmlFor="rc-weeks" hasValue={true}>
                <Input
                  id="rc-weeks"
                  name="generate_weeks_ahead"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="4"
                  placeholder=" "
                />
              </FloatingField>
            </div>
          </form>
        </DrawerBody>
        <DrawerFooter>
          <Button type="submit" form="recurring-ride-form">
            {rc.create}
          </Button>
        </DrawerFooter>
      </ResponsiveDrawer>
    </div>
  );
}
