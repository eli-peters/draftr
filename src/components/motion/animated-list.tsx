import type { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  stagger?: number;
}

/**
 * Renders children in a container. (Formerly animated, now static.)
 */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}

/**
 * Renders a single child. (Formerly animated, now static.)
 */
export function AnimatedItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
