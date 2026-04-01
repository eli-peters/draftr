import { Bicycle } from '@phosphor-icons/react/dist/ssr';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { StepHeader, PillToggle } from './shared';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

interface StepDetailsProps {
  title: string;
  description: string;
  distanceKm: string;
  elevationM: string;
  capacity: string;
  paceGroupId: string;
  isDropRide: boolean;
  paceGroups: { id: string; name: string }[];
  onFieldChange: (field: string, value: string | boolean) => void;
}

export function StepDetails({
  title,
  description,
  distanceKm,
  elevationM,
  capacity,
  paceGroupId,
  isDropRide,
  paceGroups,
  onFieldChange,
}: StepDetailsProps) {
  return (
    <div className="rounded-xl border-0 bg-surface-default p-4">
      <StepHeader heading={form.stepDetailsHeading} icon={Bicycle} />
      <div className="flex flex-col gap-5">
        <FloatingField label={form.title} htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder=" "
          />
        </FloatingField>
        <FloatingField
          label={`${form.description} ${form.optional}`}
          htmlFor="description"
          helperText={form.descriptionHelper}
          maxLength={500}
        >
          <Textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder=" "
            maxLength={500}
          />
        </FloatingField>
        {/* Ride characteristics — 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingField label={form.distance} htmlFor="distance_km">
            <Input
              id="distance_km"
              name="distance_km"
              type="number"
              step="0.1"
              min="0"
              value={distanceKm}
              onChange={(e) => onFieldChange('distanceKm', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField label={form.elevation} htmlFor="elevation_m">
            <Input
              id="elevation_m"
              name="elevation_m"
              type="number"
              min="0"
              value={elevationM}
              onChange={(e) => onFieldChange('elevationM', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField label={form.capacity} htmlFor="capacity">
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => onFieldChange('capacity', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField label={form.paceGroup} htmlFor="pace_group_id" hasValue={!!paceGroupId}>
            <Select
              name="pace_group_id"
              required
              value={paceGroupId}
              onValueChange={(v) => onFieldChange('paceGroupId', v)}
              items={Object.fromEntries(paceGroups.map((pg) => [pg.id, pg.name]))}
            >
              <SelectTrigger id="pace_group_id">
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
        <PillToggle
          id="is_drop_ride"
          label={form.isDropRide}
          checked={isDropRide}
          onCheckedChange={(v) => onFieldChange('isDropRide', v)}
        />
      </div>
    </div>
  );
}
