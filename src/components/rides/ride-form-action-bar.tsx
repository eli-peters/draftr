'use client';

import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { appContent } from '@/content/app';

const { rides: ridesContent, common } = appContent;

interface RideFormActionBarProps {
  isEdit: boolean;
  isPending: boolean;
  error: string | null;
}

export function RideFormActionBar({ isEdit, isPending, error }: RideFormActionBarProps) {
  return (
    <FloatingActionBar>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => history.back()}
        >
          {isEdit ? common.discard : common.cancel}
        </button>
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
        </Button>
      </div>
    </FloatingActionBar>
  );
}
