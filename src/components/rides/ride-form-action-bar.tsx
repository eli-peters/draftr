'use client';

import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { rides: ridesContent, common } = appContent;

interface RideFormActionBarProps {
  isEdit: boolean;
  isPending: boolean;
  error: string | null;
}

function ActionButtons({ isEdit, isPending, error }: RideFormActionBarProps) {
  return (
    <>
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
    </>
  );
}

export function RideFormActionBar(props: RideFormActionBarProps) {
  return (
    <>
      {/* Mobile — fixed bottom, pill-shaped, glass/blur */}
      <div className="fixed left-(--bar-inset-x) right-(--bar-inset-x) bottom-[max(var(--bar-inset-x),env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-lg md:hidden">
        <div className="rounded-(--bar-radius) border border-border/20 bg-surface-default/(--bar-bg-opacity) px-(--bar-padding-x-action) py-(--bar-padding-y) shadow-(--bar-shadow) backdrop-blur-(--bar-backdrop-blur)">
          <ActionButtons {...props} />
        </div>
      </div>

      {/* Desktop — static, below last section card */}
      <div className="hidden rounded-(--bar-radius-desktop) border border-border/20 bg-surface-default/(--bar-bg-opacity) px-(--bar-padding-x-desktop) py-(--bar-padding-y-desktop) shadow-(--bar-shadow-desktop) backdrop-blur-(--bar-backdrop-blur) md:block">
        <ActionButtons {...props} />
      </div>
    </>
  );
}
