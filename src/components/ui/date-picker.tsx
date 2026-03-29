'use client';

import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import { format, parse } from 'date-fns';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  /** Controlled value in YYYY-MM-DD format */
  value?: string;
  /** Called with YYYY-MM-DD string */
  onChange?: (value: string) => void;
  /** Placeholder when no date is selected */
  placeholder?: string;
  /** Minimum selectable date in YYYY-MM-DD format */
  min?: string;
  /** Maximum selectable date in YYYY-MM-DD format */
  max?: string;
  /** HTML name attribute for hidden input (form submission) */
  name?: string;
  /** HTML id attribute */
  id?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  className?: string;
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

function formatIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  min,
  max,
  name,
  id,
  required,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const fromDate = parseDate(min);
  const toDate = parseDate(max);

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              className={cn(
                'h-12 w-full justify-start border-input bg-surface-default text-left font-normal hover:bg-surface-default aria-expanded:bg-surface-default',
                !value && 'text-muted-foreground',
                className,
              )}
            />
          }
        >
          <CalendarBlank className="size-4 text-muted-foreground" />
          {selected ? <span>{format(selected, 'MMM d, yyyy')}</span> : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) gap-0 p-0" align="start">
          <Calendar
            mode="single"
            fixedWeeks
            selected={selected}
            onSelect={(date: Date | undefined) => {
              if (date) {
                onChange?.(formatIso(date));
              }
              setOpen(false);
            }}
            disabled={[
              ...(fromDate ? [{ before: fromDate }] : []),
              ...(toDate ? [{ after: toDate }] : []),
            ]}
            defaultMonth={selected ?? fromDate}
            required={required}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DatePicker };
