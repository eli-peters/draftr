import * as React from 'react';

import { cn } from '@/lib/utils';

const selectVariants = {
  default:
    'flex h-12 w-full rounded-lg border border-input bg-surface-default px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  sm: 'flex h-8 rounded-lg border border-input bg-surface-default px-2 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
};

function Select({
  className,
  selectSize = 'default',
  ...props
}: Omit<React.ComponentProps<'select'>, 'size'> & {
  selectSize?: keyof typeof selectVariants;
}) {
  return (
    <select data-slot="select" className={cn(selectVariants[selectSize], className)} {...props} />
  );
}

export { Select, selectVariants };
