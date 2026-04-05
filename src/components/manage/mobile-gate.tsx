'use client';

import { Monitor } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { appContent } from '@/content/app';

const { manage: content } = appContent;

interface MobileGateProps {
  children: React.ReactNode;
}

/**
 * Gates admin manage content behind a desktop-only check.
 * On mobile (below md): shows "Desktop recommended" message, hides children entirely.
 * On desktop (md+): renders children normally.
 */
export function MobileGate({ children }: MobileGateProps) {
  return (
    <>
      <div className="md:hidden">
        <EmptyState
          icon={Monitor}
          title={content.mobileGateTitle}
          description={content.mobileGateDescription}
        />
      </div>
      <div className="hidden md:contents">{children}</div>
    </>
  );
}
