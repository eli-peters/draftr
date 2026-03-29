import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full min-h-[80px] rounded-lg border border-input bg-surface-default px-3 py-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input-bg-disabled disabled:opacity-50 aria-invalid:border-input-border-invalid aria-invalid:ring-3 aria-invalid:ring-input-ring-invalid md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
