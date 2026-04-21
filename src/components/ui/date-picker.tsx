'use client';

import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';

import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** Controlled value in YYYY-MM-DD format */
  value?: string;
  /** Called with YYYY-MM-DD string */
  onChange?: (value: string) => void;
  /** Minimum selectable date in YYYY-MM-DD format */
  min?: string;
  /** Maximum selectable date in YYYY-MM-DD format */
  max?: string;
  /** HTML name attribute */
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
  return (
    <div className="relative">
      <input
        type="date"
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        data-slot="picker-trigger"
        className={cn(
          'h-12 w-full min-w-0 cursor-pointer rounded-none border-0 border-b border-input bg-transparent px-3 pr-9 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          ariaInvalid && 'border-destructive focus-visible:border-destructive',
          className,
        )}
      />
      <CalendarBlank
        aria-hidden
        className="pointer-events-none absolute right-3 top-8.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { DatePicker };
