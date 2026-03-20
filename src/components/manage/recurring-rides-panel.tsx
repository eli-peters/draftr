'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash, Pause, Play, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from '@/components/ui/sheet';
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
  meeting_location_name: string | null;
  pace_group_name: string | null;
}

interface RecurringRidesPanelProps {
  recurringRides: RecurringRideData[];
  clubId: string;
  meetingLocations: { id: string; name: string }[];
  paceGroups: { id: string; name: string }[];
}

export function RecurringRidesPanel({
  recurringRides,
  clubId,
  meetingLocations,
  paceGroups,
}: RecurringRidesPanelProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
        meeting_location_id: (fd.get('meeting_location_id') as string) || undefined,
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
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>{rc.heading}</SectionHeading>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {rc.create}
        </Button>
      </div>

      {message && <p className="text-sm text-success mb-4">{message}</p>}

      {recurringRides.length === 0 ? (
        <p className="text-base text-muted-foreground">{rc.noRecurring}</p>
      ) : (
        <div className="space-y-3">
          {recurringRides.map((r) => (
            <Card
              key={r.id}
              className={cn('p-5', !r.is_active && 'opacity-muted')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{r.title}</h3>
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
                    {r.pace_group_name && <span>{r.pace_group_name}</span>}
                    {r.meeting_location_name && <span>{r.meeting_location_name}</span>}
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
                    {r.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
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
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-(--sheet-height-lg) overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{rc.create}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="rc-title">{form.title} *</Label>
              <Input
                id="rc-title"
                name="title"
                required
                placeholder="e.g. Saturday Morning Social"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rc-day">{rc.dayOfWeek[0].slice(0, 3)}... *</Label>
                <Select id="rc-day" name="day_of_week" required>
                  <option value="">Day...</option>
                  {rc.dayOfWeek.map((day, i) => (
                    <option key={i} value={i}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-time">{form.startTime} *</Label>
                <Input id="rc-time" name="start_time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-recurrence">{rc.recurrence.weekly} *</Label>
                <Select id="rc-recurrence" name="recurrence" required>
                  <option value="weekly">{rc.recurrence.weekly}</option>
                  <option value="biweekly">{rc.recurrence.biweekly}</option>
                  <option value="monthly">{rc.recurrence.monthly}</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rc-season-start">{rc.seasonStartLabel}</Label>
                <Input id="rc-season-start" name="season_start_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-season-end">{rc.seasonEndLabel}</Label>
                <Input id="rc-season-end" name="season_end_date" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rc-location">{form.meetingLocation}</Label>
                <Select id="rc-location" name="meeting_location_id">
                  <option value="">{form.selectLocation}</option>
                  {meetingLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-pace">{form.paceGroup}</Label>
                <Select id="rc-pace" name="pace_group_id">
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
                <Label htmlFor="rc-distance">{form.distance}</Label>
                <Input
                  id="rc-distance"
                  name="default_distance_km"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-capacity">{form.capacity}</Label>
                <Input id="rc-capacity" name="default_capacity" type="number" min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-weeks">{rc.weeksAheadLabel}</Label>
                <Input
                  id="rc-weeks"
                  name="generate_weeks_ahead"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="4"
                />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">{rc.create}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
