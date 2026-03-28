import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  centered = false,
  className,
}: PageHeaderProps) {
  if (centered) {
    return (
      <div className={cn('relative', className)}>
        {actions && <div className="absolute top-0 right-0 flex items-center gap-1">{actions}</div>}
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <h1 className="line-clamp-2 text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="line-clamp-2 text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
