import { CalendarDots } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

interface StepWhenWhereProps {
  rideDate: string;
  startTime: string;
  dateMin: string;
  dateMax?: string;
  fieldErrors?: Record<string, string>;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}

export function StepWhenWhere({
  rideDate,
  startTime,
  dateMin,
  dateMax,
  fieldErrors,
  onDateChange,
  onTimeChange,
}: StepWhenWhereProps) {
  return (
    <ContentCard
      padding="default"
      heading={form.sectionWhenWhere}
      icon={<CalendarDots weight="duotone" className="size-6 text-primary" />}
    >
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
    </ContentCard>
  );
}
