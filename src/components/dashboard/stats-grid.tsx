import { AnimatedCounter } from '@/components/motion/animated-counter';

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
          {stat.icon && (
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <AnimatedCounter
            value={stat.value}
            suffix={stat.suffix}
            decimals={stat.decimals}
            className="text-4xl font-bold tabular-nums text-foreground"
          />
          <p className="text-sm font-medium text-muted-foreground mt-2">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
