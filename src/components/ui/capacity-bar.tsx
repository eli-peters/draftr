import { cn } from '@/lib/utils';

interface CapacityBarProps {
  signupCount: number;
  capacity: number | null;
  className?: string;
}

export function CapacityBar({ signupCount, capacity, className }: CapacityBarProps) {
  if (capacity == null) return null;

  const percent = Math.min((signupCount / capacity) * 100, 100);

  return (
    <div className={cn('h-0.5 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
