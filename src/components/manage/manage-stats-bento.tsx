'use client';

import { Bicycle, UserCircleMinus, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { StatsBento } from '@/components/dashboard/stats-bento';
import { appContent } from '@/content/app';

const { dashboard: content } = appContent.manage;

interface ManageStatsBentoProps {
  fillRate: number;
  fillRateChange: number;
  cancellationRate: number;
  cancellationsThisMonth: number;
  activeMembers: number;
}

export function ManageStatsBento({
  fillRate,
  fillRateChange,
  cancellationRate,
  cancellationsThisMonth,
  activeMembers,
}: ManageStatsBentoProps) {
  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <StatsBento
      stats={[
        {
          icon: Bicycle,
          title: content.stats.fillRate,
          value: fillRate,
          suffix: '%',
          variant: 'admin',
          visualization: {
            type: 'trend',
            direction: fillRateChange >= 0 ? 'up' : 'down',
            label: content.stats.fillRateContext(Math.abs(fillRateChange)),
            sentiment: 'neutral',
          },
        },
        {
          icon: UserCircleMinus,
          title: content.stats.cancellationRate,
          value: cancellationRate,
          suffix: '%',
          decimals: 1,
          variant: 'admin',
          visualization: {
            type: 'trend',
            direction: 'up',
            label: content.stats.cancellationContext(cancellationsThisMonth),
            sentiment: 'neutral',
          },
        },
        {
          icon: UsersThree,
          title: content.stats.activeMembers,
          value: activeMembers,
          variant: 'admin',
          visualization: {
            type: 'trend',
            direction: 'up',
            label: content.stats.activeMembersContext(monthLabel),
            sentiment: 'positive',
          },
        },
      ]}
    />
  );
}
