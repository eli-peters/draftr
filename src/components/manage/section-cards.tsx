'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bicycle,
  UserList,
  UserPlus,
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* Rides */}
        <div>
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
          icon={UserList}
          mobileIcon={UserPlus}
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
  /** Optional override icon for mobile layout. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mobileIcon?: React.ComponentType<any>;
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

// Shared card surface: stroke-only at rest (admin spec), neutral hover lift, active press.
// Magenta is reserved for the page-level CTA (Create Ride etc.) — never on hover here.
const cardSurface =
  'rounded-(--card-radius) border border-(--border-default) bg-card transition-[transform,box-shadow,border-color] duration-(--duration-normal) ease-(--ease-in-out) hover:-translate-y-0.5 hover:border-(--border-strong) hover:shadow-lg active:scale-[0.98]';

function SectionCard({
  icon: Icon,
  mobileIcon: MobileIcon,
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

  // ---------------------------------------------------------------------------
  // Mobile: thin horizontal action bar
  // ---------------------------------------------------------------------------
  if (isMobile) {
    const BarIcon = MobileIcon ?? Icon;
    const inner = (
      <>
        <BarIcon className="size-6 shrink-0 text-muted-foreground" weight="regular" />
        <div className="flex items-center gap-1.5">
          <span className="text-base font-semibold text-foreground">{actionLabel}</span>
          <ArrowCircleRight className="size-5 text-muted-foreground" weight="regular" />
        </div>
      </>
    );

    if (actionHref && !actionType) {
      return (
        <Link
          href={actionHref}
          className={`flex w-full items-center justify-between p-4 gap-3 ${cardSurface}`}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={`flex w-full items-center justify-between p-4 gap-3 ${cardSurface}`}
        onClick={handleActionClick}
      >
        {inner}
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop: left-aligned card — icon next to title (no center-stage hero pattern).
  // Premium-restrained per DESIGN_SYSTEM.md § 15.
  // ---------------------------------------------------------------------------
  return (
    <div className={`relative flex flex-col overflow-clip p-5 ${cardSurface}`}>
      {/* Card click-through */}
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-(--card-radius)"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Title row: icon + label */}
      <div className="relative z-10 flex items-center gap-2">
        <Icon className="size-5 shrink-0 text-muted-foreground" weight="regular" />
        <p className="text-base font-semibold text-foreground">{label}</p>
      </div>

      {/* Stat */}
      <p className="relative z-10 mt-2 text-sm text-(--text-secondary)">{stat}</p>

      {/* Action affordance — restrained ghost variant; primary CTA lives in PageHeader */}
      <div className="relative z-10 mt-6">
        {actionHref && !actionType ? (
          <Link
            href={actionHref}
            className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}
          >
            {actionLabel}
            <ArrowCircleRight weight="regular" />
          </Link>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleActionClick} className="-ml-3">
            {actionLabel}
            <ArrowCircleRight weight="regular" />
          </Button>
        )}
      </div>
    </div>
  );
}
