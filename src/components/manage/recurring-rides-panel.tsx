'use client';

import { useEffect, useState, useTransition } from 'react';
import { Plus, Trash, Pause, Play, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
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
import { Badge } from '@/components/ui/badge';
import { ContentCard } from '@/components/ui/content-card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';
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

export function RecurringRidesPanel({
  recurringRides,
  clubId,
  paceGroups,
}: RecurringRidesPanelProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [rcStartTime, setRcStartTime] = useState('');
  const [rcSeasonStart, setRcSeasonStart] = useState('');
  const [rcSeasonEnd, setRcSeasonEnd] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const start_time = fd.get('start_time') as string;
    const day_of_week = fd.get('day_of_week') as string;
    const recurrence = fd.get('recurrence') as string;
    if (!title || !start_time || !day_of_week || !recurrence) return;

    startTransition(async () => {
      await createRecurringRide(clubId, {
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
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRecurringRide(id);
    });
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleRecurringRide(id, !currentlyActive);
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
    <div className={isPending ? 'opacity-pending pointer-events-none' : ''}>
      {/* TODO: consider admin-specific visual treatment */}
      <ContentCard heading={rc.heading}>
        <div className="flex items-center justify-end mb-3">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {rc.create}
          </Button>
        </div>

        {message && <p className="text-sm text-success mb-4">{message}</p>}

        {recurringRides.length === 0 ? (
          <p className="text-base text-muted-foreground">{rc.noRecurring}</p>
        ) : (
          <div className="divide-y divide-border">
            {recurringRides.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0',
                  !r.is_active && 'opacity-muted',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{r.title}</h3>
                    {!r.is_active && (
                      <Badge variant="warning" className="text-xs">
                        {rc.paused}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {r.day_of_week != null && <span>{rc.dayOfWeek[r.day_of_week]}s</span>}
                    <span>{r.start_time.slice(0, 5)}</span>
                    {r.recurrence && (
                      <Badge variant="outline" className="text-xs">
                        {rc.recurrence[r.recurrence as keyof typeof rc.recurrence]}
                      </Badge>
                    )}
                    {r.pace_group_name && <span className="truncate">{r.pace_group_name}</span>}
                  </div>
                  {(r.season_start_date || r.season_end_date) && (
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {rc.seasonLabel}: {r.season_start_date ?? '...'} →{' '}
                      {r.season_end_date ?? '...'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    onClick={() => handleToggle(r.id, r.is_active)}
                    className="text-muted-foreground/50 hover:text-foreground"
                    title={r.is_active ? rc.pause : rc.resume}
                  >
                    {r.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      {mounted && (
        <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? 'bottom' : 'right'}>
          <DrawerContent
            className={
              isMobile
                ? 'max-h-(--drawer-height-lg) overflow-y-auto'
                : 'w-(--drawer-width-sidebar) overflow-y-auto'
            }
          >
            <DrawerHeader>
              <DrawerTitle>{rc.create}</DrawerTitle>
            </DrawerHeader>
            <form onSubmit={handleSubmit} className="space-y-4 px-4">
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
              <DrawerFooter>
                <Button type="submit">{rc.create}</Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
