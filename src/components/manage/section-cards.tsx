import Link from 'next/link';
import {
  Bicycle,
  UsersThree,
  Megaphone,
  Sliders,
  CaretRight,
} from '@phosphor-icons/react/dist/ssr';
import { routes } from '@/config/routes';
import { appContent } from '@/content/app';
import type { SectionCardStats } from '@/lib/manage/queries';

const { dashboard: content } = appContent.manage;

interface SectionCard {
  label: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  stat?: (stats: SectionCardStats) => string;
  cta: { label: string; href: string };
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
  },
  {
    label: content.sectionCards.announcements,
    href: routes.manageAnnouncements,
    icon: Megaphone,
    stat: (s) => content.sectionCards.thisWeekStat(s.recentAnnouncements),
    cta: { label: content.sectionCards.newAnnouncement, href: routes.manageAnnouncements },
  },
  {
    label: content.sectionCards.settings,
    href: routes.manageSettings,
    icon: Sliders,
    cta: { label: content.sectionCards.edit, href: routes.manageSettings },
  },
];

interface SectionCardsProps {
  stats: SectionCardStats;
}

export function SectionCards({ stats }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="group flex flex-col justify-between rounded-(--card-radius) border border-(--border-default) bg-card p-4 transition-all hover:border-(--border-strong) hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
              <section.icon className="h-[1.125rem] w-[1.125rem] text-muted-foreground" />
            </div>
            <CaretRight
              className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
              weight="bold"
            />
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">{section.label}</p>
            {section.stat && (
              <p className="mt-0.5 text-xs text-muted-foreground">{section.stat(stats)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
