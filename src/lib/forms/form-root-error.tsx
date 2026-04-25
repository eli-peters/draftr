'use client';

import { useFormContext, useFormState } from 'react-hook-form';

import { cn } from '@/lib/utils';

/**
 * Renders a form-level (non-field) error message produced by
 * `setError('root.serverError', …)`. Drop this into form footers
 * next to the submit button.
 */
export function FormRootError({ className }: { className?: string }) {
  const { control } = useFormContext();
  const { errors } = useFormState({ control });
  const message = errors.root?.serverError?.message;
  if (!message || typeof message !== 'string') return null;
  return (
    <p role="alert" aria-live="polite" className={cn('text-sm text-destructive', className)}>
      {message}
    </p>
  );
}
