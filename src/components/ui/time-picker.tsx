'use client';

import { Clock } from '@phosphor-icons/react/dist/ssr';

import { cn } from '@/lib/utils';

interface TimePickerProps {
  /** Controlled value in HH:mm format */
  value?: string;
  /** Called with HH:mm string */
  onChange?: (value: string) => void;
  /** Interval in minutes between options (default: 15) */
  step?: number;
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

function TimePicker({
  value,
  onChange,
  step = 15,
  name,
  id,
  required,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: TimePickerProps) {
  return (
    <div className="relative">
      <input
        type="time"
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        step={step * 60}
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
      <Clock
        aria-hidden
        className="pointer-events-none absolute right-3 top-8.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { TimePicker };
