'use client';

import { Check, X, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { common } = appContent;

interface InlineEditActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function InlineEditActions({ onSave, onCancel, isPending }: InlineEditActionsProps) {
  return (
    <div className="flex items-center gap-2 justify-end pt-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        disabled={isPending}
        aria-label={common.cancel}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSave}
        disabled={isPending}
        aria-label={common.save}
      >
        {isPending ? (
          <SpinnerGap className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
