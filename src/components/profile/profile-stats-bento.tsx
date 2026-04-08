'use client';

import { BicycleIcon, CalendarCheckIcon } from '@phosphor-icons/react/dist/ssr';
import { MetricCard } from '@/components/dashboard/metric-card';
import { appContent } from '@/content/app';

const { profile: content } = appContent;

interface ProfileStatsBentoProps {
  totalRides: number;
  ridesThisMonth: number;
}

/**
 * ProfileStatsBento — 2-tile soft-shadow stat grid for the profile page.
 *
 * Tiles: Total Rides · This Month
 */
export function ProfileStatsBento({ totalRides, ridesThisMonth }: ProfileStatsBentoProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard icon={BicycleIcon} title={content.statsBento.totalRides} value={totalRides} />
      <MetricCard
        icon={CalendarCheckIcon}
        title={content.statsBento.thisMonth}
        value={ridesThisMonth}
      />
    </div>
  );
}
