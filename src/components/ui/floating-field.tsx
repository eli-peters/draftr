'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';

import { shouldShowCounter } from '@/lib/forms/limits';
import { applyPasteTruncate } from '@/lib/forms/paste-truncate';
import { cn } from '@/lib/utils';
import { FormFieldContext, useFormField } from './form';

interface FloatingFieldProps {
  /** The label text */
  label: string;
  /** Links label to the input via htmlFor. Optional when used inside <FormField> — id comes from context. */
  htmlFor?: string;
  /** The ShadCN primitive (Input, Textarea, Select, DatePicker, etc.) */
  children: React.ReactNode;
  /** For JS-controlled fields (Select, DatePicker, TimePicker): whether the field has a value */
  hasValue?: boolean;
  /** Optional leading icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional helper text below the field */
  helperText?: string;
  /** Optional error message below the field. Ignored when inside <FormField> — error comes from RHF state. */
  error?: string;
  /** Max character length — shows a counter (within ~20% of limit) and truncates oversize pastes with a toast */
  maxLength?: number;
  /** Additional className on the outer wrapper */
  className?: string;
}

/**
 * Branches between two implementations based on whether a <FormField>
 * ancestor exists. The branch uses plain useContext (always safe) so
 * each implementation has a stable hook order. This prevents
 * react-hook-form's useFormState/useFormContext hooks from running
 * outside an RHF provider, which crashes with "Cannot read properties
 * of null".
 */
function FloatingField(props: FloatingFieldProps) {
  const fieldContext = React.useContext(FormFieldContext);
  if (fieldContext) {
    return <FloatingFieldRhf {...props} />;
  }
  return <FloatingFieldImpl {...props} />;
}

function FloatingFieldRhf(props: FloatingFieldProps) {
  const field = useFormField();
  return (
    <FloatingFieldImpl
      {...props}
      htmlFor={props.htmlFor ?? field.formItemId}
      error={field.error?.message ? String(field.error.message) : props.error}
    />
  );
}

type EditableInput = HTMLInputElement | HTMLTextAreaElement;

function isEditable(el: Element | null): el is EditableInput {
  if (!el) return false;
  const slot = (el as HTMLElement).dataset?.slot;
  return slot === 'textarea' || slot === 'input';
}

function FloatingFieldImpl({
  label,
  htmlFor,
  children,
  hasValue,
  icon: Icon,
  helperText,
  error,
  maxLength,
  className,
}: FloatingFieldProps) {
  const isJsMode = hasValue !== undefined;
  const [charCount, setCharCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read initial value for pre-filled inputs/textareas (defaultValue or controlled)
  useEffect(() => {
    if (!maxLength || !containerRef.current) return;
    const target = containerRef.current.querySelector<EditableInput>(
      '[data-slot="textarea"], [data-slot="input"]',
    );
    if (target && target.value.length > 0) {
      setCharCount(target.value.length);
    }
  }, [maxLength]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (!maxLength) return;
      const target = e.target as Element | null;
      if (isEditable(target)) {
        setCharCount(target.value.length);
      }
    },
    [maxLength],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!maxLength) return;
      const target = e.target as Element | null;
      if (!isEditable(target)) return;
      if (applyPasteTruncate(e, target, maxLength)) {
        setCharCount(target.value.length);
      }
    },
    [maxLength],
  );

  const counterVisible = maxLength ? shouldShowCounter(charCount, maxLength) : false;

  return (
    <div
      ref={maxLength ? containerRef : undefined}
      className={cn('floating-field relative', isJsMode && 'group', className)}
      data-mode={isJsMode ? 'js' : 'css'}
      data-has-value={hasValue || undefined}
      data-has-icon={Icon ? '' : undefined}
      onInput={maxLength ? handleInput : undefined}
      onPaste={maxLength ? handlePaste : undefined}
    >
      {children}
      {Icon && (
        <Icon className="pointer-events-none absolute right-3 top-8.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <label>{label}</label>}
      {(helperText || maxLength || error) && (
        <div className="mt-1 flex items-baseline justify-between gap-2 px-3">
          {helperText && !error ? (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          ) : error ? (
            <p
              data-slot="field-error"
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : (
            <span />
          )}
          {maxLength && (
            <span
              aria-live="polite"
              data-visible={counterVisible || undefined}
              className={cn(
                'shrink-0 text-xs tabular-nums text-muted-foreground transition-opacity duration-150 motion-reduce:transition-none',
                counterVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { FloatingField };
export type { FloatingFieldProps };
