import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PillToggle } from './shared';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

interface StepDetailsProps {
  title: string;
  description: string;
  capacity: string;
  paceGroupId: string;
  isDropRide: boolean;
  paceGroups: { id: string; name: string }[];
  fieldErrors?: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean) => void;
  onCapacityChange: (value: string) => void;
  rideDate: string;
  startTime: string;
  dateMin: string;
  dateMax?: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}

export function StepDetails({
  title,
  description,
  capacity,
  paceGroupId,
  isDropRide,
  paceGroups,
  fieldErrors,
  onFieldChange,
  onCapacityChange,
  rideDate,
  startTime,
  dateMin,
  dateMax,
  onDateChange,
  onTimeChange,
}: StepDetailsProps) {
  return (
    <ContentCard
      padding="default"
      heading={form.sectionRideDetails}
      icon={<Bicycle weight="duotone" className="size-6 text-primary" />}
    >
      <div className="flex flex-col gap-5">
        <FloatingField label={form.title} htmlFor="title" error={fieldErrors?.title}>
          <Input
            id="title"
            name="title"
            required
            aria-invalid={!!fieldErrors?.title}
            value={title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder=" "
          />
        </FloatingField>

        <FloatingField
          label={`${form.description} ${form.optional}`}
          htmlFor="description"
          helperText={form.descriptionHelper}
          maxLength={250}
        >
          <Textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder=" "
            maxLength={250}
          />
        </FloatingField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingField
            label={form.date}
            htmlFor="ride_date"
            hasValue={!!rideDate}
            error={fieldErrors?.rideDate}
          >
            <DatePicker
              id="ride_date"
              name="ride_date"
              value={rideDate}
              onChange={onDateChange}
              min={dateMin}
              max={dateMax}
              required
              aria-invalid={!!fieldErrors?.rideDate}
            />
          </FloatingField>
          <FloatingField
            label={form.startTime}
            htmlFor="start_time"
            hasValue={!!startTime}
            error={fieldErrors?.startTime}
          >
            <TimePicker
              id="start_time"
              name="start_time"
              value={startTime}
              onChange={onTimeChange}
              required
              aria-invalid={!!fieldErrors?.startTime}
            />
          </FloatingField>
        </div>

        {/* ── Pace & Capacity ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingField
            label={form.paceGroup}
            htmlFor="pace_group_id"
            hasValue={!!paceGroupId}
            error={fieldErrors?.paceGroupId}
          >
            <Select
              name="pace_group_id"
              required
              value={paceGroupId}
              onValueChange={(v) => onFieldChange('paceGroupId', v)}
              items={Object.fromEntries(paceGroups.map((pg) => [pg.id, pg.name]))}
            >
              <SelectTrigger id="pace_group_id" aria-invalid={!!fieldErrors?.paceGroupId}>
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

          <FloatingField label={form.capacity} htmlFor="capacity" error={fieldErrors?.capacity}>
            <Input
              id="capacity"
              name="capacity"
              inputMode="numeric"
              required
              aria-invalid={!!fieldErrors?.capacity}
              value={capacity}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || /^\d+$/.test(raw)) onCapacityChange(raw);
              }}
              onBlur={() => {
                if (capacity === '') return;
                const n = Number(capacity);
                if (n < 2) onCapacityChange('2');
                else if (n > 250) onCapacityChange('250');
              }}
              placeholder=" "
            />
          </FloatingField>
        </div>

        {/* ── Drop Ride Toggle ─────────────────────────────────────── */}
        <PillToggle
          id="is_drop_ride"
          label={form.isDropRide}
          checked={isDropRide}
          onCheckedChange={(v) => onFieldChange('isDropRide', v)}
        />
      </div>
    </ContentCard>
  );
}
