import { cn } from '@/lib/utils';

interface MetadataItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export function MetadataItem({ icon: Icon, children, className }: MetadataItemProps) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
