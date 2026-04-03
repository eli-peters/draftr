'use client';

import { Clock } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TimePickerProps {
  /** Controlled value in HH:mm format */
  value?: string;
  /** Called with HH:mm string */
  onChange?: (value: string) => void;
  /** Interval in minutes between options (default: 15) */
  step?: number;
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

function generateTimeOptions(step: number): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    options.push(`${h}:${m}`);
  }
  return options;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
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
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const options = generateTimeOptions(step);

  useEffect(() => {
    if (open && value && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected]');
      if (selected) {
        selected.scrollIntoView({ block: 'center' });
      }
    }
  }, [open, value]);

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
          {value ? <span>{formatTimeDisplay(value)}</span> : <span />}
          <Clock className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) gap-0 overflow-hidden p-1.5" align="start">
          <div ref={listRef} className="flex max-h-64 flex-col overflow-y-auto">
            {options.map((time) => {
              const isSelected = value === time;
              return (
                <button
                  key={time}
                  type="button"
                  data-selected={isSelected || undefined}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors outline-none focus-ring-inset',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent',
                  )}
                  onClick={() => {
                    onChange?.(time);
                    setOpen(false);
                  }}
                >
                  {formatTimeDisplay(time)}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { TimePicker };
