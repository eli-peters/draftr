'use client';

import { WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { common } = appContent;

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <WarningCircle weight="duotone" className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{common.error}</h2>
      <p className="mt-2 text-base text-muted-foreground max-w-80">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} className="mt-6" size="sm">
        {common.retry}
      </Button>
    </div>
  );
}
