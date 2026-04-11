'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bicycle,
  UsersThree,
  Megaphone,
  Sliders,
  Laptop,
  CaretRight,
} from '@phosphor-icons/react/dist/ssr';
import { routes } from '@/config/routes';
import { appContent } from '@/content/app';
import { InviteMemberDrawer } from '@/components/manage/invite-member-drawer';
import { AnnouncementFormDrawer } from '@/components/manage/announcements-panel';
import type { SectionCardStats } from '@/lib/manage/queries';

const { dashboard: content } = appContent.manage;

type ActionType = 'invite' | 'announcement';

interface SectionCard {
  label: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  stat?: (stats: SectionCardStats) => string;
  /** Static descriptive subtitle, shown on desktop only. */
  subtitle?: string;
  mobileHint?: string;
  cta: { label: string; href: string };
  /** When set, the card footer opens a drawer instead of navigating. */
  actionType?: ActionType;
}

const sections: SectionCard[] = [
  {
    label: content.sectionCards.rides,
    href: routes.manageRides,
    icon: Bicycle,
    stat: (s) => content.sectionCards.upcomingStat(s.upcomingRides),
    cta: { label: content.sectionCards.createRide, href: routes.manageNewRide },
  },
  {
    label: content.sectionCards.members,
    href: routes.manageMembers,
    icon: UsersThree,
    stat: (s) => content.sectionCards.activeStat(s.activeMembers),
    cta: { label: content.sectionCards.invite, href: routes.manageMembers },
    actionType: 'invite',
  },
  {
    label: content.sectionCards.announcements,
    href: routes.manageAnnouncements,
    icon: Megaphone,
    stat: (s) => content.sectionCards.thisWeekStat(s.recentAnnouncements),
    cta: { label: content.sectionCards.newAnnouncement, href: routes.manageAnnouncements },
    actionType: 'announcement',
  },
  {
    label: content.sectionCards.settings,
    href: routes.manageSettings,
    icon: Sliders,
    subtitle: content.sectionCards.settingsStat,
    mobileHint: content.sectionCards.comingSoonMobile,
    cta: { label: content.sectionCards.edit, href: routes.manageSettings },
  },
];

const footerClass =
  'relative z-10 block bg-surface-card-footer-soft px-4 py-2.5 text-xs font-semibold text-primary hover:underline';

interface SectionCardsProps {
  stats: SectionCardStats;
  clubId: string;
}

export function SectionCards({ stats, clubId }: SectionCardsProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const router = useRouter();

  function handleFooterAction(actionType: ActionType) {
    if (actionType === 'invite') setInviteOpen(true);
    else setAnnouncementOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <div
            key={section.href}
            className="group relative flex flex-col overflow-clip rounded-(--card-radius) border border-(--border-default) bg-card transition-all hover:border-(--border-strong) hover:shadow-sm"
          >
            <Link
              href={section.href}
              className="absolute inset-0 z-0 rounded-(--card-radius)"
              tabIndex={-1}
              aria-hidden="true"
            />

            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                  <section.icon className="h-[1.125rem] w-[1.125rem] text-muted-foreground" />
                </div>
                <CaretRight
                  className="h-4 w-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5"
                  weight="bold"
                />
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">{section.label}</p>
                {section.stat && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{section.stat(stats)}</p>
                )}
                {section.subtitle && (
                  <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">
                    {section.subtitle}
                  </p>
                )}
                {section.mobileHint && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground md:hidden">
                    <Laptop className="h-3 w-3" />
                    {section.mobileHint}
                  </p>
                )}
              </div>
            </div>

            {section.actionType ? (
              <button
                type="button"
                className={`${footerClass} w-full cursor-pointer text-left`}
                onClick={() => handleFooterAction(section.actionType!)}
              >
                {section.cta.label}
              </button>
            ) : (
              <Link href={section.cta.href} className={footerClass}>
                {section.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Drawers rendered outside the overflow-clip cards */}
      <InviteMemberDrawer
        clubId={clubId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => router.push(routes.manageMembers)}
      />
      <AnnouncementFormDrawer
        open={announcementOpen}
        onOpenChange={setAnnouncementOpen}
        mode="create"
        clubId={clubId}
        onSuccess={() => router.push(routes.manageAnnouncements)}
      />
    </>
  );
}
