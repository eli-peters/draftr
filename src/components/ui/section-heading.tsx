import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'p' | 'span';
}

export function SectionHeading({ children, className, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
