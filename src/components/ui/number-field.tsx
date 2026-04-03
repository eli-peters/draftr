'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { Minus, Plus } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';

interface NumberFieldProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
}

function NumberField({
  id,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  required,
  'aria-invalid': ariaInvalid,
  className,
}: NumberFieldProps) {
  const numericValue = value === '' ? undefined : Number(value);

  const clamp = useCallback(
    (n: number) => {
      let clamped = n;
      if (min != null && clamped < min) clamped = min;
      if (max != null && clamped > max) clamped = max;
      return clamped;
    },
    [min, max],
  );

  const increment = useCallback(() => {
    const current = numericValue ?? min ?? 0;
    onChange(String(clamp(current + step)));
  }, [numericValue, min, step, clamp, onChange]);

  const decrement = useCallback(() => {
    const current = numericValue ?? min ?? 0;
    onChange(String(clamp(current - step)));
  }, [numericValue, min, step, clamp, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        onChange('');
        return;
      }
      // Allow only digits
      if (/^\d+$/.test(raw)) {
        onChange(raw);
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    if (value === '') return;
    const n = Number(value);
    if (isNaN(n)) {
      onChange('');
      return;
    }
    const clamped = clamp(n);
    if (clamped !== n) {
      onChange(String(clamped));
    }
  }, [value, clamp, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
      }
    },
    [increment, decrement],
  );

  const atMin = min != null && numericValue != null && numericValue <= min;
  const atMax = max != null && numericValue != null && numericValue >= max;

  return (
    <div
      className={cn(
        'flex items-center gap-0 rounded-none border-0 border-b border-input bg-transparent transition-colors focus-within:border-ring',
        ariaInvalid && 'border-input-border-invalid',
        className,
      )}
      role="group"
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={atMin}
        onClick={decrement}
        aria-label={appContent.common.decrease}
        className="flex h-12 w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <Minus className="size-4" weight="bold" />
      </button>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={numericValue}
        aria-invalid={ariaInvalid}
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder=" "
        className="h-12 w-full min-w-0 border-0 bg-transparent px-1 text-center text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={atMax}
        onClick={increment}
        aria-label={appContent.common.increase}
        className="flex h-12 w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <Plus className="size-4" weight="bold" />
      </button>
    </div>
  );
}

export { NumberField };
