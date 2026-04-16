'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { addMonths, subMonths, isSameDay, isSameMonth, startOfMonth } from 'date-fns';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { CalendarFilters } from './calendar-filters';
import { AgendaZone } from './agenda-zone';
import type { CalendarRide } from '@/lib/rides/queries';
import type { RideWithDetails } from '@/types/database';

interface RidesCalendarProps {
  initialMonthRides: CalendarRide[];
  upcomingRides: RideWithDetails[];
  paceGroups: { id: string; name: string; sort_order: number }[];
  timezone: string;
}

/** Format date as YYYY-MM-DD for ride matching. */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthCacheKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

// Swipe detection constants
const SWIPE_THRESHOLD = 50;
const EDGE_ZONE = 24; // px from left edge to ignore (avoid conflict with edge-swipe back nav)

export function RidesCalendar({
  initialMonthRides,
  upcomingRides,
  paceGroups,
  timezone,
}: RidesCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);
  const [monthRidesCache, setMonthRidesCache] = useState<Map<string, CalendarRide[]>>(() => {
    return new Map([[monthCacheKey(today), initialMonthRides]]);
  });

  // Filters
  const [activePaceIds, setActivePaceIds] = useState<string[]>([]);
  const [signedUpOnly, setSignedUpOnly] = useState(false);

  // Swipe state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track in-flight fetches to avoid duplicate requests
  const fetchingRef = useRef(new Set<string>());

  // Current month rides from cache
  const currentMonthRides = monthRidesCache.get(monthCacheKey(currentMonth)) ?? [];

  // Fetch month data if not already cached or in-flight.
  // Uses functional setState to check cache inside the updater, avoiding
  // stale closure issues and the need for a synced ref.
  const fetchMonth = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    if (fetchingRef.current.has(key)) return;

    // Optimistic check — updater will also guard against duplicates
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

  // Fetch current + adjacent months when currentMonth changes
  useEffect(() => {
    const cur = currentMonth;
    const next = addMonths(cur, 1);
    const prev = subMonths(cur, 1);
    fetchMonth(cur.getFullYear(), cur.getMonth() + 1);
    fetchMonth(next.getFullYear(), next.getMonth() + 1);
    fetchMonth(prev.getFullYear(), prev.getMonth() + 1);
  }, [currentMonth, fetchMonth]);

  // Month navigation
  const goNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDate(null);
  }, []);

  const goPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDate(null);
  }, []);

  const goToday = useCallback(() => {
    const todayMonth = startOfMonth(new Date());
    if (!isSameMonth(currentMonth, todayMonth)) {
      setDirection(todayMonth > currentMonth ? 1 : -1);
      setCurrentMonth(todayMonth);
    }
    setSelectedDate(new Date());
  }, [currentMonth]);

  // Date selection — tap again to deselect
  const handleSelectDate = useCallback(
    (date: Date) => {
      if (selectedDate && isSameDay(date, selectedDate)) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
    },
    [selectedDate],
  );

  const clearSelection = useCallback(() => {
    setSelectedDate(null);
  }, []);

  // Swipe handlers for month navigation
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

      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goNextMonth();
        else goPrevMonth();
      }
    },
    [goNextMonth, goPrevMonth],
  );

  // Apply filters to month rides (for calendar dots)
  const filteredMonthRides = currentMonthRides.filter((ride) => {
    if (activePaceIds.length > 0 && ride.pace_group_sort_order !== null) {
      const matchesPace = paceGroups.some(
        (pg) => activePaceIds.includes(pg.id) && pg.sort_order === ride.pace_group_sort_order,
      );
      if (!matchesPace) return false;
    }
    if (signedUpOnly && !ride.user_has_signup && !ride.user_is_leader) return false;
    return true;
  });

  // Apply filters to agenda rides
  const filteredAgendaRides = upcomingRides.filter((ride) => {
    if (activePaceIds.length > 0) {
      if (!activePaceIds.includes(ride.pace_group_id ?? '')) return false;
    }
    if (signedUpOnly) {
      const status = ride.current_user_signup_status;
      if (status !== 'confirmed' && status !== 'waitlisted') return false;
    }
    if (selectedDate) {
      return ride.ride_date === toDateKey(selectedDate);
    }
    return true;
  });

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <CalendarHeader
        currentMonth={currentMonth}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        onToday={goToday}
      />

      <CalendarGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        monthRides={filteredMonthRides}
        direction={direction}
        onSelectDate={handleSelectDate}
      />

      <div className="mt-4 mb-4">
        <CalendarFilters
          paceGroups={paceGroups}
          activePaceIds={activePaceIds}
          signedUpOnly={signedUpOnly}
          onPaceChange={setActivePaceIds}
          onSignedUpChange={setSignedUpOnly}
        />
      </div>

      <AgendaZone
        rides={filteredAgendaRides}
        selectedDate={selectedDate}
        timezone={timezone}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
