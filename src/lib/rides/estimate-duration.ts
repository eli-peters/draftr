import type { PaceGroup } from '@/types/database';

// ---------------------------------------------------------------------------
// Break stop configuration by pace tier
// ---------------------------------------------------------------------------

interface BreakConfig {
  /** Distance between stops in km */
  stopIntervalKm: number;
  /** Duration per stop in minutes */
  stopDurationMin: number;
}

/**
 * Determine break stop behaviour based on pace group speed.
 * Uses `moving_pace_min` as a proxy for pace tier to avoid coupling to group names.
 */
function getBreakConfig(
  paceGroup: Pick<PaceGroup, 'moving_pace_min' | 'moving_pace_max'>,
): BreakConfig {
  const min = paceGroup.moving_pace_min ?? 0;

  if (min >= 38) return { stopIntervalKm: 100, stopDurationMin: 10 }; // Elite
  if (min >= 35) return { stopIntervalKm: 65, stopDurationMin: 10 }; // Advanced A
  if (min >= 32) return { stopIntervalKm: 55, stopDurationMin: 10 }; // Advanced B
  if (min >= 29) return { stopIntervalKm: 45, stopDurationMin: 12 }; // Intermediate A
  if (min >= 26) return { stopIntervalKm: 40, stopDurationMin: 12 }; // Intermediate B
  return { stopIntervalKm: 25, stopDurationMin: 15 }; // Social
}

// ---------------------------------------------------------------------------
// Duration estimation
// ---------------------------------------------------------------------------

type PaceGroupInput = Pick<PaceGroup, 'moving_pace_min' | 'moving_pace_max'>;

/**
 * Estimate a ride's end time from distance, pace group, and start time.
 *
 * Returns a time string `"HH:MM"` or `null` when inputs are insufficient.
 * Pure function — no DB calls, deterministic, testable.
 */
export function estimateEndTime(
  distanceKm: number | null | undefined,
  paceGroup: PaceGroupInput | null | undefined,
  startTime: string,
): string | null {
  if (!distanceKm || distanceKm <= 0) return null;
  if (!paceGroup || !paceGroup.moving_pace_min) return null;

  // Average speed — if max is null (Elite), estimate as min * 1.05
  const max = paceGroup.moving_pace_max ?? paceGroup.moving_pace_min * 1.05;
  const avgSpeedKmh = (paceGroup.moving_pace_min + max) / 2;

  // Moving time in minutes
  const movingTimeMin = (distanceKm / avgSpeedKmh) * 60;

  // Break stops
  const { stopIntervalKm, stopDurationMin } = getBreakConfig(paceGroup);
  const numStops = Math.max(0, Math.floor(distanceKm / stopIntervalKm) - 1);
  const breakTimeMin = numStops * stopDurationMin;

  // Total duration
  const totalMin = Math.round(movingTimeMin + breakTimeMin);

  // Parse start time and add duration
  const [sh, sm] = startTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = Math.min(startMinutes + totalMin, 23 * 60 + 59); // cap at 23:59

  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}
