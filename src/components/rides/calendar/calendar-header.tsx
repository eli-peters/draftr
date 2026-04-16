'use client';

import { format } from 'date-fns';
import { CaretLeft, CaretRight, CalendarDots } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { calendar: content } = appContent;

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-lg font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
          onClick={onToday}
          aria-label={content.todayButton}
        >
          <CalendarDots className="h-4.5 w-4.5" weight="bold" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <CaretLeft className="h-4.5 w-4.5" weight="bold" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <CaretRight className="h-4.5 w-4.5" weight="bold" />
        </Button>
      </div>
    </div>
  );
}
