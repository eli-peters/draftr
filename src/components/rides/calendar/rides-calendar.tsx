'use client';

import { useState, useCallback, useEffect, useRef, Suspense, use } from 'react';
import {
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  startOfMonth,
  isSameMonth,
  isBefore,
  isAfter,
  endOfMonth,
} from 'date-fns';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { AgendaZone } from './agenda-zone';
import { SkeletonGroup } from '@/components/motion/skeleton-group';
import type { CalendarRide } from '@/lib/rides/queries';
import type { RideWithDetails } from '@/types/database';

interface RidesCalendarProps {
  initialMonthRides: CalendarRide[];
  upcomingRidesPromise: Promise<RideWithDetails[]>;
  timezone: string;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthCacheKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

const SWIPE_THRESHOLD = 50;
const EDGE_ZONE = 24;

function AgendaSkeleton() {
  return (
    <div className="mt-6">
      <SkeletonGroup>
        <div className="h-5 w-40 skeleton-shimmer rounded" />
        {[0, 1].map((i) => (
          <div key={i} className="h-36 skeleton-shimmer rounded-(--card-radius)" />
        ))}
      </SkeletonGroup>
    </div>
  );
}

interface AgendaStreamingProps {
  upcomingRidesPromise: Promise<RideWithDetails[]>;
  selectedDate: Date;
  timezone: string;
}

function AgendaStreaming({ upcomingRidesPromise, selectedDate, timezone }: AgendaStreamingProps) {
  const upcomingRides = use(upcomingRidesPromise);
  const anchorKey = toDateKey(selectedDate);
  const listedRides = upcomingRides.filter((ride) => ride.ride_date >= anchorKey);
  return <AgendaZone rides={listedRides} selectedDate={selectedDate} timezone={timezone} />;
}

export function RidesCalendar({
  initialMonthRides,
  upcomingRidesPromise,
  timezone,
}: RidesCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(today));
  const [direction, setDirection] = useState(0);
  const [monthRidesCache, setMonthRidesCache] = useState<Map<string, CalendarRide[]>>(() => {
    return new Map([[monthCacheKey(today), initialMonthRides]]);
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(new Set<string>());

  const currentMonthRides = monthRidesCache.get(monthCacheKey(currentMonth)) ?? [];

  const fetchMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    if (fetchingRef.current.has(key)) return;
    fetchingRef.current.add(key);
    fetch(`/api/rides/month?year=${year}&month=${month}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CalendarRide[] | null) => {
        fetchingRef.current.delete(key);
        if (data) {
          setMonthRidesCache((prev) => {
            if (prev.has(key)) return prev;
            return new Map(prev).set(key, data);
          });
        }
      })
      .catch(() => {
        fetchingRef.current.delete(key);
      });
  }, []);

  useEffect(() => {
    const cur = currentMonth;
    const next = addMonths(cur, 1);
    const prev = subMonths(cur, 1);
    fetchMonth(cur.getFullYear(), cur.getMonth() + 1);
    fetchMonth(next.getFullYear(), next.getMonth() + 1);
    fetchMonth(prev.getFullYear(), prev.getMonth() + 1);
  }, [currentMonth, fetchMonth]);

  const goNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const goPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  // Jump-to-today affordance (Option A) — iOS Calendar / Reminders pattern.
  // Option B was to omit this and leave month nav manual; rejected because a
  // dedicated button is cheap and matches native expectations.
  const goToToday = useCallback(() => {
    const now = new Date();
    setDirection(0);
    setCurrentMonth(startOfMonth(now));
    setSelectedDate(startOfDay(now));
  }, []);

  const todayStart = startOfDay(today);
  const isOnToday = isSameDay(selectedDate, todayStart) && isSameMonth(currentMonth, todayStart);

  const handleSelectDate = useCallback(
    (date: Date) => {
      if (!isSameMonth(date, currentMonth)) {
        const monthStart = startOfMonth(currentMonth);
        if (isBefore(date, monthStart)) {
          setDirection(-1);
          setCurrentMonth((m) => subMonths(m, 1));
        } else if (isAfter(date, endOfMonth(currentMonth))) {
          setDirection(1);
          setCurrentMonth((m) => addMonths(m, 1));
        }
      }
      setSelectedDate((prev) => (isSameDay(date, prev) ? prev : startOfDay(date)));
    },
    [currentMonth],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < EDGE_ZONE) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > SWIPE_THRESHOLD && absX > absY * 1.5) {
        if (dx < 0) goNextMonth();
        else goPrevMonth();
      }
    },
    [goNextMonth, goPrevMonth],
  );

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <CalendarHeader
        currentMonth={currentMonth}
        showToday={!isOnToday}
        onToday={goToToday}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
      />

      <CalendarGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        monthRides={currentMonthRides}
        direction={direction}
        onSelectDate={handleSelectDate}
      />

      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaStreaming
          upcomingRidesPromise={upcomingRidesPromise}
          selectedDate={selectedDate}
          timezone={timezone}
        />
      </Suspense>
    </div>
  );
}
