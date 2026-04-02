import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'p' | 'span';
  icon?: React.ElementType;
}

export function SectionHeading({
  children,
  className,
  as: Tag = 'h2',
  icon: Icon,
}: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        'text-overline font-semibold uppercase tracking-wider text-muted-foreground',
        Icon && 'flex items-center gap-1.5',
        className,
      )}
    >
      {Icon && <Icon weight="duotone" className="size-3.5 text-primary" />}
      {children}
    </Tag>
  );
}
