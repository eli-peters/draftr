import { ArrowUp, ArrowDown } from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';
import { AnimatedCounter } from '@/components/motion/animated-counter';
import { cn } from '@/lib/utils';

type TrendSentiment = 'positive' | 'neutral' | 'negative';

interface TrendVisualization {
  type: 'trend';
  direction: 'up' | 'down';
  label: string;
  sentiment: TrendSentiment;
}

export interface MetricCardProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  visualization?: TrendVisualization;
  className?: string;
}

const trendBadgeBg: Record<TrendSentiment, string> = {
  positive: 'bg-(--color-badge-status-confirmed-bg)',
  neutral: 'bg-(--color-accent-primary-subtle)',
  negative: 'bg-(--color-accent-primary-subtle)',
};

function TrendBadge({ direction, label, sentiment }: TrendVisualization) {
  const Arrow = direction === 'up' ? ArrowUp : ArrowDown;
  return (
    <div
      className={cn(
        'inline-flex min-w-0 max-w-full items-center justify-center gap-1 rounded-full px-2 py-1',
        trendBadgeBg[sentiment],
      )}
    >
      <Arrow className="size-3.5 shrink-0 text-foreground" weight="bold" />
      <span className="truncate font-sans text-[0.8125rem] leading-5 text-foreground">{label}</span>
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  title,
  value,
  suffix,
  decimals,
  visualization,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-border bg-card p-3 text-card-foreground',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Icon className="size-8 text-(--color-accent-primary-default)" weight="duotone" />
        <p className="w-full font-display text-base font-semibold tracking-[-0.0288px] text-center text-foreground">
          {title}
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <AnimatedCounter
          value={value}
          suffix={suffix}
          decimals={decimals}
          className="w-full font-display text-[2.5rem] leading-11.5 font-bold tracking-[-0.48px] text-center text-foreground"
        />
        {visualization?.type === 'trend' && <TrendBadge {...visualization} />}
      </div>
    </div>
  );
}
