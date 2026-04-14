'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PersonSimpleBike,
  UserCircleMinus,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { Separator } from '@/components/ui/separator';
import { useMotionPresets } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { appContent } from '@/content/app';

const { dashboard: content } = appContent.manage;

/* ── Types ─────────────────────────────────────────────────────────────── */

type TrendSentiment = 'positive' | 'neutral' | 'negative';

interface TrendVisualization {
  direction: 'up' | 'down';
  label: string;
  sentiment: TrendSentiment;
}

interface StatColumnProps {
  icon: PhosphorIcon;
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  visualization?: TrendVisualization;
  children?: React.ReactNode;
}

interface ManageStatsBentoProps {
  fillRate: number;
  fillRateChange: number;
  cancellationRate: number;
  cancellationsThisMonth: number;
  activeMembers: number;
  /** Optional title/context overrides for non-admin contexts (e.g. leader hub). */
  labelOverrides?: {
    fillRate?: string;
    cancellationRate?: string;
    activeMembers?: string;
    activeMembersContext?: string;
  };
}

/* ── TrendBadge ────────────────────────────────────────────────────────── */

const trendPillStyles: Record<TrendSentiment, string> = {
  positive: 'bg-(--badge-stat-positive-bg) text-(--badge-stat-positive-text)',
  neutral: 'bg-(--badge-stat-neutral-bg) text-(--badge-stat-neutral-text)',
  negative: 'bg-(--badge-stat-negative-bg) text-(--badge-stat-negative-text)',
};

function TrendBadge({ direction, label, sentiment }: TrendVisualization) {
  const Arrow = direction === 'up' ? ArrowUpIcon : ArrowDownIcon;
  return (
    <div
      className={cn(
        'inline-flex min-w-0 max-w-full items-center justify-center gap-1 rounded-full px-3 py-1',
        trendPillStyles[sentiment],
      )}
    >
      <Arrow className="size-4 shrink-0" weight="bold" />
      <span className="truncate font-sans text-sm font-semibold">{label}</span>
    </div>
  );
}

/* ── StatColumn ────────────────────────────────────────────────────────── */

function StatColumn({
  icon,
  title,
  value,
  suffix,
  decimals,
  visualization,
  children,
}: StatColumnProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pb-8 md:flex-1 md:px-6">
      <div className="flex flex-col items-center gap-3">
        {React.createElement(icon, {
          weight: 'duotone',
          className: 'size-10 text-foreground',
        })}
        <p className="font-semibold leading-snug text-muted-foreground md:text-lg">{title}</p>
      </div>

      <AnimatedCounter
        value={value}
        suffix={suffix}
        decimals={decimals}
        className="w-full text-center font-display text-4xl font-bold tracking-tight text-foreground mb-2"
      />

      {visualization && <TrendBadge {...visualization} />}
      {children}
    </div>
  );
}

/* ── ManageStatsBento ──────────────────────────────────────────────────── */

export function ManageStatsBento({
  fillRate,
  fillRateChange,
  cancellationRate,
  cancellationsThisMonth,
  activeMembers,
  labelOverrides,
}: ManageStatsBentoProps) {
  const { fadeSlideUp, staggerContainer } = useMotionPresets();

  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const fillRateTitle = labelOverrides?.fillRate ?? content.stats.fillRate;
  const cancellationRateTitle = labelOverrides?.cancellationRate ?? content.stats.cancellationRate;
  const activeMembersTitle = labelOverrides?.activeMembers ?? content.stats.activeMembers;
  const activeMembersContext =
    labelOverrides?.activeMembersContext ?? content.stats.activeMembersContext(monthLabel);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.06, 0.05)}
      className="flex flex-col md:flex-row md:items-stretch"
    >
      {/* Fill rate — full width on mobile, first column on desktop */}
      <motion.div variants={fadeSlideUp} className="md:flex-1">
        <StatColumn
          icon={PersonSimpleBike}
          title={fillRateTitle}
          value={fillRate}
          suffix="%"
          visualization={{
            direction: fillRateChange >= 0 ? 'up' : 'down',
            label: content.stats.fillRateContext(Math.abs(fillRateChange)),
            sentiment: fillRateChange >= 0 ? 'positive' : 'negative',
          }}
        />
      </motion.div>

      {/* Mobile: horizontal separator / Desktop: vertical separator */}
      <Separator orientation="horizontal" className="md:hidden" />
      <Separator orientation="vertical" className="hidden md:block" />

      {/* Bottom row on mobile (side by side with vertical separator), columns on desktop */}
      <div className="flex flex-row items-stretch md:flex-1 md:contents mt-6">
        <motion.div variants={fadeSlideUp} className="flex-1">
          <StatColumn
            icon={UserCircleMinus}
            title={cancellationRateTitle}
            value={cancellationRate}
            suffix="%"
            decimals={1}
            visualization={{
              direction: 'up',
              label: content.stats.cancellationContext(cancellationsThisMonth),
              sentiment: 'negative',
            }}
          />
        </motion.div>

        <Separator orientation="vertical" className="my-4 md:my-0" />

        <motion.div variants={fadeSlideUp} className="flex-1">
          <StatColumn
            icon={UsersThree}
            title={activeMembersTitle}
            value={activeMembers}
            visualization={{
              direction: 'up',
              label: activeMembersContext,
              sentiment: 'positive',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
