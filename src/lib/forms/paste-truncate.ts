'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { appContent } from '@/content/app';

type EditableInput = HTMLInputElement | HTMLTextAreaElement;

/**
 * If a paste would exceed `maxLength`, splice in only the portion that fits,
 * fire a synthetic `input` event so React state stays in sync, and notify
 * the user via toast. Returns true when truncation occurred.
 */
export function applyPasteTruncate(
  e: React.ClipboardEvent,
  target: EditableInput,
  maxLength: number,
): boolean {
  const pasted = e.clipboardData.getData('text');
  if (!pasted) return false;

  const selectionStart = target.selectionStart ?? target.value.length;
  const selectionEnd = target.selectionEnd ?? target.value.length;
  const remaining = maxLength - (target.value.length - (selectionEnd - selectionStart));
  if (pasted.length <= remaining) return false;

  e.preventDefault();
  const trimmed = pasted.slice(0, Math.max(0, remaining));
  const next = target.value.slice(0, selectionStart) + trimmed + target.value.slice(selectionEnd);
  const setter = Object.getOwnPropertyDescriptor(
    target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(target, next);
  target.dispatchEvent(new Event('input', { bubbles: true }));
  const caret = selectionStart + trimmed.length;
  target.setSelectionRange(caret, caret);
  toast.info(appContent.validation.generic.pasteTrimmed(maxLength));
  return true;
}

/** Hook form for attaching directly to an Input/Textarea via `onPaste`. */
export function usePasteTruncate(maxLength: number | undefined) {
  return useCallback(
    (e: React.ClipboardEvent<EditableInput>) => {
      if (!maxLength) return;
      applyPasteTruncate(e, e.currentTarget, maxLength);
    },
    [maxLength],
  );
}
