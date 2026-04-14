'use client';

import { useRouter } from 'next/navigation';
import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { rides: ridesContent, common } = appContent;

interface RideFormActionBarProps {
  isEdit: boolean;
  isPending: boolean;
  error: string | null;
}

export function RideFormActionBar({ isEdit, isPending, error }: RideFormActionBarProps) {
  const router = useRouter();

  return (
    <ActionBar>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <div className="flex w-full items-center justify-between gap-3">
        <Button type="button" variant="muted" size="sm" onClick={() => router.back()}>
          {isEdit ? common.discard : common.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
        </Button>
      </div>
    </ActionBar>
  );
}
