'use client';

import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import { format, parse } from 'date-fns';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  /** Controlled value in YYYY-MM-DD format */
  value?: string;
  /** Called with YYYY-MM-DD string */
  onChange?: (value: string) => void;
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
  /** Whether the field has a validation error */
  'aria-invalid'?: boolean;
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
  min,
  max,
  name,
  id,
  required,
  disabled,
  'aria-invalid': ariaInvalid,
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
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          data-slot="picker-trigger"
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-none border-0 border-b border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            ariaInvalid && 'border-destructive focus-visible:border-destructive',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {selected ? <span>{format(selected, 'MMM d, yyyy')}</span> : <span />}
          <CalendarBlank className="size-4 shrink-0 text-muted-foreground" />
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
