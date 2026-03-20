import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
  variant?: 'primary' | 'destructive';
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  variant = 'primary',
  children,
  className,
}: EmptyStateProps) {
  const isDestructive = variant === 'destructive';

  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-8', className)}>
      {Icon && (
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full',
            isDestructive ? 'bg-destructive/10' : 'bg-primary/8',
          )}
        >
          <Icon
            weight="duotone"
            className={cn('h-10 w-10', isDestructive ? 'text-destructive' : 'text-primary/60')}
          />
        </div>
      )}
      <p className={cn('text-lg font-semibold text-foreground', Icon && 'mt-4')}>{title}</p>
      <p className="mt-2 text-base text-muted-foreground max-w-80">{description}</p>
      {children}
    </div>
  );
}
