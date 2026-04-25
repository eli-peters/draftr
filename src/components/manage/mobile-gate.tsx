'use client';

import { Laptop } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { appContent } from '@/content/app';

const { manage: content } = appContent;

/**
 * Gates admin manage content behind a desktop check.
 * Shows "Desktop recommended" on mobile, hides children entirely.
 */
export function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="md:hidden">
        <EmptyState
          icon={<Laptop weight="duotone" />}
          title={content.mobileGateTitle}
          description={content.mobileGateDescription}
        />
      </div>
      <div className="hidden md:contents">{children}</div>
    </>
  );
}
