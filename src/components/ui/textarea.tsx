import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full min-h-[80px] rounded-none border-0 border-b border-input bg-transparent px-3 py-2.5 text-base transition-[color,border-color] duration-(--duration-fast) outline-none hover:border-ring placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-input-border-invalid',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
