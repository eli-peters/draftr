'use client';

import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
    <EmptyState
      title={common.error}
      description={error.message || common.errorDescription}
      icon={<WarningCircle weight="duotone" />}
      variant="destructive"
      className="flex-1 px-4 py-16"
    >
      <Button onClick={reset} className="mt-6" size="sm">
        {common.retry}
      </Button>
    </EmptyState>
  );
}
