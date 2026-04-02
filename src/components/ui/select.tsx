'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { CaretUpDown, Check } from '@phosphor-icons/react/dist/ssr';

import { cn } from '@/lib/utils';

const SelectSizeContext = React.createContext<'default' | 'sm'>('default');

const triggerVariants = {
  default:
    'flex h-12 w-full items-center justify-between rounded-none border-0 border-b border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground aria-invalid:border-destructive',
  sm: 'flex h-8 w-full items-center justify-between rounded-none border-0 border-b border-input bg-transparent px-2 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground aria-invalid:border-destructive',
};

function Select({
  children,
  size = 'default',
  onValueChange,
  ...props
}: Omit<SelectPrimitive.Root.Props<string>, 'onValueChange'> & {
  size?: 'default' | 'sm';
  onValueChange?: (value: string) => void;
}) {
  const handleValueChange = React.useMemo(() => {
    if (!onValueChange) return undefined;
    return (value: string | null) => onValueChange(value ?? '');
  }, [onValueChange]);

  return (
    <SelectSizeContext.Provider value={size}>
      <SelectPrimitive.Root
        data-slot="select"
        onValueChange={handleValueChange}
        modal={false}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectSizeContext.Provider>
  );
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  const size = React.useContext(SelectSizeContext);
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(triggerVariants[size], className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <CaretUpDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({ ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectContent({
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>) {
  return (
    <SelectPrimitive.Positioner
      className="isolate z-60 outline-none"
      align={align}
      side={side}
      sideOffset={sideOffset}
      alignItemWithTrigger={false}
      positionMethod="fixed"
    >
      <SelectPrimitive.Popup
        data-slot="select-content"
        className={cn(
          'z-60 max-h-(--available-height) w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-200 [--tw-ease:var(--ease-out)] data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      />
    </SelectPrimitive.Positioner>
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex cursor-default items-center gap-1.5 rounded-md py-2 pr-8 pl-3 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('flex flex-col gap-0.5', className)}
      {...props}
    />
  );
}

function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn(
        'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
};
