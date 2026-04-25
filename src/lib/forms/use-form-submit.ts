'use client';

import { useCallback } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { appContent } from '@/content/app';

import { focusFirstError } from './focus-first-error';

type ServerActionResult = { error?: string | null; success?: boolean } | void;

interface UseFormSubmitOptions<TValues extends FieldValues, TResult extends ServerActionResult> {
  form: UseFormReturn<TValues>;
  /** Server action or async handler. Return `{ error }` to surface form-level errors via FormRootError. */
  onSubmit: (values: TValues) => Promise<TResult> | TResult;
  /** Optional step-switcher hook for multi-step forms. */
  onStep?: (fieldName: string) => void;
  /** Fired after a successful submit. */
  onSuccess?: (result: TResult) => void;
}

/**
 * Wraps form.handleSubmit with three behaviours every Draftr form needs:
 *
 *  1. Focus moves to the first errored field on a validation failure
 *     (multi-step aware via `onStep`).
 *  2. Server action errors get surfaced as `root.serverError` so a
 *     <FormMessage /> bound to `root.serverError` shows them inline.
 *  3. Thrown exceptions are caught and surfaced as a generic
 *     "Something went wrong" message — never bubble up to React.
 *
 * Returns a stable submit handler suitable for `<form onSubmit={...}>`.
 */
export function useFormSubmit<
  TValues extends FieldValues,
  TResult extends ServerActionResult = ServerActionResult,
>({ form, onSubmit, onStep, onSuccess }: UseFormSubmitOptions<TValues, TResult>) {
  return useCallback(
    (event?: React.BaseSyntheticEvent) => {
      return form.handleSubmit(
        async (values) => {
          form.clearErrors('root.serverError' as never);
          try {
            const result = await onSubmit(values);
            const error = (result as { error?: string | null } | undefined)?.error;
            if (error) {
              form.setError('root.serverError' as never, { type: 'server', message: error });
              return;
            }
            onSuccess?.(result as TResult);
          } catch (err) {
            // Next.js redirect() and notFound() throw control-flow errors that
            // must propagate to the framework. Detect them via the `digest`
            // marker the runtime stamps onto the error.
            if (
              err &&
              typeof err === 'object' &&
              'digest' in err &&
              typeof (err as { digest?: unknown }).digest === 'string' &&
              ((err as { digest: string }).digest.startsWith('NEXT_REDIRECT') ||
                (err as { digest: string }).digest === 'NEXT_NOT_FOUND')
            ) {
              throw err;
            }
            form.setError('root.serverError' as never, {
              type: 'server',
              message: appContent.validation.generic.submitFailed,
            });
          }
        },
        focusFirstError(form, { onStep }),
      )(event);
    },
    [form, onSubmit, onStep, onSuccess],
  );
}
