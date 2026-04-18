import { ArrowUpIcon, ArrowDownIcon } from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { CardIconHeader } from '@/components/ui/card-icon-header';
import { cn } from '@/lib/utils';

type TrendSentiment = 'positive' | 'neutral' | 'negative';
type MetricCardVariant = 'outlined' | 'admin';

interface TrendVisualization {
  type: 'trend';
  direction: 'up' | 'down';
  label: string;
  sentiment: TrendSentiment;
}

export interface MetricCardProps {
  icon: PhosphorIcon;
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  visualization?: TrendVisualization;
  /** Surface treatment: outlined (shadow, consumer pages) or admin (border, no shadow) */
  variant?: MetricCardVariant;
  className?: string;
}

const trendBadgeBg: Record<TrendSentiment, string> = {
  positive: 'bg-(--color-badge-status-confirmed-bg)',
  neutral: 'bg-(--color-accent-primary-subtle)',
  negative: 'bg-(--color-accent-primary-subtle)',
};

function TrendBadge({ direction, label, sentiment }: TrendVisualization) {
  const Arrow = direction === 'up' ? ArrowUpIcon : ArrowDownIcon;
  return (
    <div
      className={cn(
        'inline-flex min-w-0 max-w-full items-center justify-center gap-1 rounded-full px-2 py-1',
        trendBadgeBg[sentiment],
      )}
    >
      <Arrow className="size-3.5 shrink-0 text-foreground" weight="bold" />
      <span className="truncate font-sans text-status-label text-foreground">{label}</span>
    </div>
  );
}

const metricVariantStyles: Record<MetricCardVariant, string> = {
  outlined: 'bg-card shadow-(--card-shadow)',
  admin: 'border border-(--border-default) bg-card',
};

export function MetricCard({
  icon,
  title,
  value,
  suffix,
  decimals,
  visualization,
  variant = 'outlined',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-2 rounded-(--card-radius) p-(--card-padding) text-card-foreground',
        metricVariantStyles[variant],
        className,
      )}
    >
      <CardIconHeader icon={icon} title={title} />

      <div className="flex w-full flex-col items-center gap-3">
        <AnimatedCounter
          value={value}
          suffix={suffix}
          decimals={decimals}
          className="w-full font-display text-4xl font-bold text-center text-foreground tabular-nums"
        />
        {visualization?.type === 'trend' && <TrendBadge {...visualization} />}
      </div>
    </div>
  );
}
