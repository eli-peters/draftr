'use client';

import { useRouter } from 'next/navigation';
import { InviteMemberDrawer } from '@/components/manage/invite-member-drawer';
import { CreateAnnouncementButton } from '@/components/manage/announcements-panel';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { dashboard: content } = appContent.manage;

const footerClass =
  'block w-full text-left bg-[color-mix(in_oklab,var(--surface-card-footer)_40%,transparent)] px-4 py-2.5 text-xs font-semibold text-primary cursor-pointer hover:underline';

interface SectionCardActionProps {
  clubId: string;
}

export function InviteCardAction({ clubId }: SectionCardActionProps) {
  const router = useRouter();

  return (
    <div onClick={(e) => e.preventDefault()}>
      <InviteMemberDrawer
        clubId={clubId}
        trigger={<span className={footerClass}>{content.sectionCards.invite}</span>}
        onSuccess={() => router.push(routes.manageMembers)}
      />
    </div>
  );
}

export function AnnouncementCardAction({ clubId }: SectionCardActionProps) {
  const router = useRouter();

  return (
    <div onClick={(e) => e.preventDefault()}>
      <CreateAnnouncementButton
        clubId={clubId}
        trigger={<span className={footerClass}>{content.sectionCards.newAnnouncement}</span>}
        onSuccess={() => router.push(routes.manageAnnouncements)}
      />
    </div>
  );
}
