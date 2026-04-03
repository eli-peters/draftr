import { AnimatedCounter } from '@/components/motion/animated-counter';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          {stat.icon && (
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <AnimatedCounter
            value={stat.value}
            suffix={stat.suffix}
            decimals={stat.decimals}
            className="font-mono text-4xl font-bold tabular-nums text-foreground"
          />
          <p className="text-sm font-medium text-muted-foreground mt-2">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
