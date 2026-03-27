'use client';

import { appContent } from '@/content/app';

const { common } = appContent;

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center px-4">
        <h2 className="text-lg font-semibold">{common.error}</h2>
        <p className="mt-2 text-base text-muted-foreground max-w-80 mx-auto">
          {error.message || common.errorDescription}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {common.retry}
        </button>
      </div>
    </div>
  );
}
