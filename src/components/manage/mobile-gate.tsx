import { Laptop } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { SystemNoticeBanner } from '@/components/dashboard/system-notice-banner';
import { appContent } from '@/content/app';

const { manage: content } = appContent;

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
            icon={Laptop}
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
        <SystemNoticeBanner
          icon={Laptop}
          title={content.mobileGateTitle}
          body={content.mobileBannerDescription}
        />
      </div>
      {children}
    </>
  );
}
