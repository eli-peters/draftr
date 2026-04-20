'use client';

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';
import { DURATIONS, EASE } from '@/lib/motion';

interface CalendarHeaderProps {
  currentMonth: Date;
  showToday: boolean;
  onToday: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarHeader({
  currentMonth,
  showToday,
  onToday,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  const monthLabel = format(currentMonth, 'MMMM');
  const yearLabel = format(currentMonth, 'yyyy');

  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="font-display text-2xl leading-9 tracking-tight text-foreground">
        <span className="font-semibold">{monthLabel}</span>{' '}
        <span className="font-extralight">{yearLabel}</span>
      </h2>
      <div className="flex items-center gap-2">
        <AnimatePresence initial={false}>
          {showToday && (
            <motion.div
              key="today"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: DURATIONS.fast, ease: EASE.out }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 font-sans text-sm text-muted-foreground hover:text-primary"
                onClick={onToday}
              >
                {appContent.common.today}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <CaretLeft className="size-5" weight="bold" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <CaretRight className="size-5" weight="bold" />
        </Button>
      </div>
    </div>
  );
}
