import type { FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Move focus to the first errored input after a failed submit.
 *
 * Pass this as the `onError` callback to `form.handleSubmit`:
 *
 *   <form onSubmit={form.handleSubmit(onValid, focusFirstError(form))}>
 *
 * Walks the errors object in registration order and calls
 * form.setFocus on the first leaf. Falls back to a DOM lookup for
 * fields that aren't focusable via RHF (e.g. JS-controlled selects).
 *
 * For multi-step forms, pass `onStep` to receive the field name
 * before focus runs, so the host can switch steps if needed.
 */
export function focusFirstError<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  options?: {
    onStep?: (fieldName: string) => void;
  },
) {
  return (errors: FieldErrors<TFieldValues>) => {
    const firstName = findFirstErrorPath(errors);
    if (!firstName) return;

    options?.onStep?.(firstName);

    requestAnimationFrame(() => {
      try {
        form.setFocus(firstName as never, { shouldSelect: true });
      } catch {
        // setFocus throws when the field isn't registered as a native input.
        // Fall back to DOM: look for an element with name={firstName}.
        const el = document.querySelector<HTMLElement>(`[name="${cssEscape(firstName)}"]`);
        if (el) {
          el.focus({ preventScroll: false });
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  };
}

function findFirstErrorPath(errors: Record<string, unknown>, prefix = ''): string | null {
  for (const key of Object.keys(errors)) {
    const value = errors[key] as Record<string, unknown> | undefined;
    if (!value) continue;
    if ('message' in value || 'type' in value) {
      return prefix ? `${prefix}.${key}` : key;
    }
    if (typeof value === 'object') {
      const nested = findFirstErrorPath(value, prefix ? `${prefix}.${key}` : key);
      if (nested) return nested;
    }
  }
  return null;
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, '\\$1');
}
