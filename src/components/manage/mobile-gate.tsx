'use client';

import { Monitor } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { AnnouncementBanner } from '@/components/dashboard/announcement-banner';
import { appContent } from '@/content/app';

const { manage: content } = appContent;

const mobileBannerAnnouncement = {
  id: 'mobile-gate-banner',
  title: content.mobileGateTitle,
  body: content.mobileBannerDescription,
  announcement_type: 'info' as const,
  is_dismissible: false,
  created_by_name: null,
  published_at: new Date().toISOString(),
};

interface MobileGateProps {
  children: React.ReactNode;
  mode?: 'block' | 'banner';
}

/**
 * Gates admin manage content behind a desktop check.
 * - block:  Shows "Desktop recommended" on mobile, hides children entirely.
 * - banner: Shows an info banner on mobile, renders children below.
 */
export function MobileGate({ children, mode = 'banner' }: MobileGateProps) {
  if (mode === 'block') {
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

  return (
    <>
      <div className="md:hidden">
        <AnnouncementBanner announcement={mobileBannerAnnouncement} />
      </div>
      {children}
    </>
  );
}
