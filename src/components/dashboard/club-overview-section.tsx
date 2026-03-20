'use client';

import { Bicycle, UsersThree, ChartLineUp, TrendUp } from '@phosphor-icons/react';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { StatsGrid } from './stats-grid';

const { dashboard: dashContent, manage: manageContent } = appContent;

const mockClubStats = {
  totalRides: 24,
  activeMembers: 187,
  signupsThisWeek: 48,
  avgRiders: 16,
};

const clubStatItems = [
  { label: manageContent.stats.totalRides, value: mockClubStats.totalRides, icon: Bicycle },
  {
    label: manageContent.stats.activeMembers,
    value: mockClubStats.activeMembers,
    icon: UsersThree,
  },
  {
    label: manageContent.stats.signupsThisWeek,
    value: mockClubStats.signupsThisWeek,
    icon: ChartLineUp,
  },
  { label: manageContent.stats.avgRiders, value: mockClubStats.avgRiders, icon: TrendUp },
];

export function ClubOverviewSection() {
  return (
    <section>
      <SectionHeading className="mb-4">{dashContent.admin.clubOverview}</SectionHeading>
      <StatsGrid stats={clubStatItems} />
    </section>
  );
}
