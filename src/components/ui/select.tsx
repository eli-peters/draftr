import * as React from 'react';

import { cn } from '@/lib/utils';

const selectVariants = {
  default:
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  sm: 'flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
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
