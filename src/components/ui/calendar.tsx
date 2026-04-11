'use client';

import * as React from 'react';
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker';
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-popover group/calendar p-4 [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-full', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-[--cell-size] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-[--cell-size] select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-lg border',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn('bg-popover absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'select-none font-semibold text-foreground',
          captionLayout === 'label'
            ? 'text-sm'
            : '[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-lg pl-2 pr-1 text-sm [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('grid w-full grid-cols-7', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground size-[--cell-size] flex items-center justify-center select-none text-xs font-medium',
          defaultClassNames.weekday,
        ),
        week: cn('mt-1 grid w-full grid-cols-7', defaultClassNames.week),
        week_number_header: cn('w-[--cell-size] select-none', defaultClassNames.week_number_header),
        week_number: cn('text-muted-foreground select-none text-xs', defaultClassNames.week_number),
        day: cn(
          'group/day relative size-[--cell-size] flex items-center justify-center select-none rounded-lg p-0 aria-selected:bg-primary aria-selected:text-primary-foreground',
          defaultClassNames.day,
        ),
        range_start: cn('bg-accent rounded-l-lg', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-lg', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-lg data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'text-(--text-tertiary) aria-selected:text-(--text-tertiary)',
          defaultClassNames.outside,
        ),
        disabled: cn('text-muted-foreground/40 pointer-events-none', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => {
          return (
            <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
          );
        },
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <CaretLeft className={cn('size-4', chevronClassName)} {...chevronProps} />;
          }
          if (orientation === 'right') {
            return <CaretRight className={cn('size-4', chevronClassName)} {...chevronProps} />;
          }
          return <CaretDown className={cn('size-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => {
          return (
            <td {...weekProps}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'size-full rounded-lg font-normal group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
