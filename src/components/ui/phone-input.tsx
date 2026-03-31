'use client';

import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { stripToDigits, formatPhoneLive, toE164 } from '@/lib/phone';

interface PhoneInputProps extends Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> {
  defaultValue?: string | null;
  name: string;
}

export function PhoneInput({ defaultValue, name, className, ...props }: PhoneInputProps) {
  const [digits, setDigits] = useState(() => {
    if (!defaultValue) return '';
    const d = stripToDigits(defaultValue);
    // Strip leading country code 1 if 11 digits
    return d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(0, 10);
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripToDigits(e.target.value).slice(0, 10);
    setDigits(raw);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && digits.length > 0) {
        const input = e.currentTarget;
        // If there's a text selection, let native behavior handle bulk delete via onChange
        if (input.selectionStart !== input.selectionEnd) return;
        // No selection — delete the last digit (handles format characters correctly)
        e.preventDefault();
        setDigits((prev) => prev.slice(0, -1));
      }
    },
    [digits.length],
  );

  const formatted = formatPhoneLive(digits);
  const e164 = digits.length === 10 ? (toE164(digits) ?? '') : '';

  return (
    <>
      <Input
        ref={inputRef}
        inputMode="tel"
        value={formatted}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
      <input type="hidden" name={name} value={e164 || (digits.length > 0 ? digits : '')} />
    </>
  );
}
