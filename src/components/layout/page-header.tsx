import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  centered = true,
  sticky = false,
  className,
}: PageHeaderProps) {
  if (centered) {
    return (
      <div className={cn('mb-6', className)}>
        <div className="flex items-start">
          {/* Invisible counterbalance keeps the title visually centered when actions are present */}
          {actions && (
            <div className="flex flex-1 items-center gap-1" aria-hidden="true">
              <div className="invisible">{actions}</div>
            </div>
          )}
          <div className="min-w-0 text-center">
            <div className="flex min-w-0 max-w-full items-center justify-center gap-3">
              <h1 className="line-clamp-2 text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-1 items-center justify-end gap-1">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-6 flex items-start justify-between gap-3 md:gap-4',
        sticky &&
          'sticky top-[calc(env(safe-area-inset-top)+3rem)] z-30 -mx-5 bg-background px-5 pt-1 pb-3 md:-mx-6 md:top-[calc(4rem+0.75rem)] md:px-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="line-clamp-2 text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex h-9 shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
