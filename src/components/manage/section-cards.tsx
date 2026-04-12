'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bicycle,
  UsersThree,
  Megaphone,
  Sliders,
  ArrowCircleRight,
} from '@phosphor-icons/react/dist/ssr';
import { routes } from '@/config/routes';
import { appContent } from '@/content/app';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button, buttonVariants } from '@/components/ui/button';
import { InviteMemberDrawer } from '@/components/manage/invite-member-drawer';
import { AnnouncementFormDrawer } from '@/components/manage/announcements-panel';
import type { SectionCardStats } from '@/lib/manage/queries';

const { dashboard: content } = appContent.manage;

type ActionType = 'invite' | 'announcement';

interface SectionCardsProps {
  stats: SectionCardStats;
  clubId: string;
}

export function SectionCards({ stats, clubId }: SectionCardsProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  const membersStat =
    stats.pendingMembers > 0
      ? content.sectionCards.pendingInvitesStat(stats.pendingMembers)
      : content.sectionCards.activeStat(stats.activeMembers);

  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        {/* Rides — full width on mobile, single col on desktop */}
        <div className="col-span-2 md:col-span-1">
          <SectionCard
            icon={Bicycle}
            label={content.sectionCards.rides}
            stat={content.sectionCards.upcomingStat(stats.upcomingRides)}
            href={routes.manageRides}
            actionLabel={content.sectionCards.createRide}
            actionHref={routes.manageNewRide}
            isMobile={isMobile}
          />
        </div>

        {/* Members */}
        <SectionCard
          icon={UsersThree}
          label={content.sectionCards.members}
          stat={membersStat}
          href={routes.manageMembers}
          actionLabel={content.sectionCards.invite}
          actionType="invite"
          onAction={() => setInviteOpen(true)}
          isMobile={isMobile}
        />

        {/* Announcements */}
        <SectionCard
          icon={Megaphone}
          label={content.sectionCards.announcements}
          stat={content.sectionCards.thisWeekStat(stats.recentAnnouncements)}
          href={routes.manageAnnouncements}
          actionLabel={content.sectionCards.newAnnouncement}
          actionType="announcement"
          onAction={() => setAnnouncementOpen(true)}
          isMobile={isMobile}
        />

        {/* Settings — hidden on mobile (fully gated, no quick action) */}
        <div className="hidden md:block">
          <SectionCard
            icon={Sliders}
            label={content.sectionCards.settings}
            stat={content.sectionCards.settingsStat}
            href={routes.manageSettings}
            actionLabel={content.sectionCards.edit}
            actionHref={routes.manageSettings}
            isMobile={false}
          />
        </div>
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

// ---------------------------------------------------------------------------
// Individual card — matches Figma node 1655:6540
// Centered icon, title, stat line, action link with arrow
// ---------------------------------------------------------------------------

interface SectionCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  label: string;
  stat: string;
  href: string;
  actionLabel: string;
  /** Direct link for the action (e.g. create ride page). */
  actionHref?: string;
  /** Drawer action type — mutually exclusive with actionHref. */
  actionType?: ActionType;
  /** Callback when a drawer action is triggered. */
  onAction?: () => void;
  /**
   * Whether the viewport is mobile.
   * Option A: on mobile, card click-through is disabled — cards are action-only containers.
   * To switch to Option B (let users hit the gate), remove the isMobile conditional on the Link.
   */
  isMobile: boolean;
}

function SectionCard({
  icon: Icon,
  label,
  stat,
  href,
  actionLabel,
  actionHref,
  actionType,
  onAction,
  isMobile,
}: SectionCardProps) {
  function handleActionClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (actionType && onAction) {
      onAction();
    }
  }

  return (
    <div className="relative flex flex-col items-center overflow-clip rounded-(--card-radius) border border-(--border-default) bg-card px-4 pt-8 pb-8 transition-[transform,box-shadow,border-color,background-color] duration-(--duration-normal) ease-(--ease-in-out) hover:-translate-y-0.5 hover:border-accent-primary-muted hover:shadow-md active:scale-[0.98]">
      {/* Card click-through: desktop only (Option A — mobile cards are action-only containers) */}
      {!isMobile && (
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-(--card-radius)"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary-subtle">
        <Icon className="size-9 text-accent-secondary-default" weight="duotone" />
      </div>

      {/* Title + stat */}
      <div className="mt-6 w-full text-center">
        <p className="text-xl font-semibold leading-7 tracking-tight text-foreground mb-2">
          {label}
        </p>
        <p className="text-md text-(--text-secondary)">{stat}</p>
      </div>

      {/* Action button */}
      <div className="relative z-10 mt-8">
        {actionHref && !actionType ? (
          <Link href={actionHref} className={buttonVariants({ variant: 'ghost', size: 'default' })}>
            {actionLabel}
            <ArrowCircleRight weight="fill" />
          </Link>
        ) : (
          <Button variant="ghost" size="default" onClick={handleActionClick}>
            {actionLabel}
            <ArrowCircleRight weight="fill" />
          </Button>
        )}
      </div>
    </div>
  );
}
