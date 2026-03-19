'use client';

import { Bicycle, CalendarDots, Path, Mountains } from '@phosphor-icons/react';
import { StatsGrid } from './stats-grid';

interface DashboardStatsProps {
  stats: {
    label: string;
    value: number;
    suffix?: string;
    decimals?: number;
  }[];
}

const iconMap = [Bicycle, CalendarDots, Path, Mountains];

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statsWithIcons = stats.map((stat, i) => ({
    ...stat,
    icon: iconMap[i],
  }));

  return <StatsGrid stats={statsWithIcons} />;
}
