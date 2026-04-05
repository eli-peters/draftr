import { MetricCard, type MetricCardProps } from '@/components/dashboard/metric-card';
import { cn } from '@/lib/utils';

interface StatsBentoProps {
  stats: MetricCardProps[];
  className?: string;
}

export function StatsBento({ stats, className }: StatsBentoProps) {
  const isBento = stats.length === 3;

  return (
    <div
      className={cn(
        'grid gap-4',
        isBento ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        className,
      )}
    >
      {stats.map((stat, i) => (
        <MetricCard
          key={stat.title}
          {...stat}
          className={cn(isBento && i === 0 && 'col-span-2 md:col-span-1', stat.className)}
        />
      ))}
    </div>
  );
}
