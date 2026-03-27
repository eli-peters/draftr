import { describe, it, expect } from 'vitest';
import { estimateEndTime } from '@/lib/rides/estimate-duration';

// Pace group fixtures matching DHF seed data
const social = { moving_pace_min: 22, moving_pace_max: 26 };
const intB = { moving_pace_min: 26, moving_pace_max: 29 };
const intA = { moving_pace_min: 29, moving_pace_max: 32 };
const advB = { moving_pace_min: 32, moving_pace_max: 35 };
const advA = { moving_pace_min: 35, moving_pace_max: 38 };
const elite = { moving_pace_min: 38, moving_pace_max: null };

describe('estimateEndTime', () => {
  // -----------------------------------------------------------------------
  // Null / edge case inputs
  // -----------------------------------------------------------------------

  it('returns null when distance is null', () => {
    expect(estimateEndTime(null, social, '09:00')).toBeNull();
  });

  it('returns null when distance is undefined', () => {
    expect(estimateEndTime(undefined, social, '09:00')).toBeNull();
  });

  it('returns null when distance is zero', () => {
    expect(estimateEndTime(0, social, '09:00')).toBeNull();
  });

  it('returns null when distance is negative', () => {
    expect(estimateEndTime(-10, social, '09:00')).toBeNull();
  });

  it('returns null when pace group is null', () => {
    expect(estimateEndTime(40, null, '09:00')).toBeNull();
  });

  it('returns null when moving_pace_min is null', () => {
    expect(estimateEndTime(40, { moving_pace_min: null, moving_pace_max: 30 }, '09:00')).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Social rides — avg 24 km/h, stops every 25 km (15 min each)
  // -----------------------------------------------------------------------

  it('Social 35km: ~1h27m moving, 0 stops (35/25=1.4, floor-1=0)', () => {
    // 35 / 24 = 1.458h = 87.5 min → ~88 min = 1h28m
    const result = estimateEndTime(35, social, '09:00');
    expect(result).toBe('10:28');
  });

  it('Social 40km: ~1h40m moving, 0 stops (40/25=1.6, floor-1=0)', () => {
    // 40 / 24 = 100 min → 1h40m
    const result = estimateEndTime(40, social, '07:00');
    expect(result).toBe('08:40');
  });

  it('Social 60km: ~2h30m moving + 1 stop × 15m = 2h45m', () => {
    // 60 / 24 = 150 min, stops: floor(60/25)-1 = 1 stop × 15 = 15 min → 165 min
    const result = estimateEndTime(60, social, '08:00');
    expect(result).toBe('10:45');
  });

  // -----------------------------------------------------------------------
  // Intermediate B — avg 27.5 km/h, stops every 40 km (12 min each)
  // -----------------------------------------------------------------------

  it('Intermediate B 55km: ~2h moving, 0 stops', () => {
    // 55 / 27.5 = 120 min, stops: floor(55/40)-1 = 0
    const result = estimateEndTime(55, intB, '08:30');
    expect(result).toBe('10:30');
  });

  // -----------------------------------------------------------------------
  // Intermediate A — avg 30.5 km/h, stops every 45 km (12 min each)
  // -----------------------------------------------------------------------

  it('Intermediate A 80km: ~2h37m moving, 0 stop × 12m', () => {
    // 80 / 30.5 = 157.4 min, stops: floor(80/45)-1 = 0
    const result = estimateEndTime(80, intA, '07:00');
    expect(result).toBe('09:37');
  });

  // -----------------------------------------------------------------------
  // Advanced B — avg 33.5 km/h, stops every 55 km (10 min each)
  // -----------------------------------------------------------------------

  it('Advanced B 45km: ~1h21m moving, 0 stops', () => {
    // 45 / 33.5 = 80.6 min → 81 min, stops: floor(45/55)-1 = -1 → 0
    const result = estimateEndTime(45, advB, '18:00');
    expect(result).toBe('19:21');
  });

  // -----------------------------------------------------------------------
  // Advanced A — avg 36.5 km/h, stops every 65 km (10 min each)
  // -----------------------------------------------------------------------

  it('Advanced A 80km: ~2h11m moving, 0 stops', () => {
    // 80 / 36.5 = 131.5 min → 132 min, stops: floor(80/65)-1 = 0
    const result = estimateEndTime(80, advA, '08:00');
    expect(result).toBe('10:12');
  });

  // -----------------------------------------------------------------------
  // Elite — avg ~39.9 km/h (38 * 1.05 = 39.9), stops every 100 km (10 min)
  // -----------------------------------------------------------------------

  it('Elite 100km with null max: uses min * 1.05', () => {
    // avg = (38 + 39.9) / 2 = 38.95, 100 / 38.95 = 154.0 min → 154 min
    // stops: floor(100/100)-1 = 0
    const result = estimateEndTime(100, elite, '06:00');
    expect(result).toBe('08:34');
  });

  it('Elite 160km: long ride with 0 stops (floor(160/100)-1=0)', () => {
    // 160 / 38.95 = 246.5 min → 247 min = 4h07m
    // stops: floor(160/100)-1 = 0
    const result = estimateEndTime(160, elite, '06:00');
    expect(result).toBe('10:06');
  });

  // -----------------------------------------------------------------------
  // Cap at 23:59
  // -----------------------------------------------------------------------

  it('caps at 23:59 for extremely long rides', () => {
    // Social 500km would take 20+ hours
    const result = estimateEndTime(500, social, '08:00');
    expect(result).toBe('23:59');
  });

  // -----------------------------------------------------------------------
  // Start time with seconds
  // -----------------------------------------------------------------------

  it('handles HH:MM:SS start time format', () => {
    const result = estimateEndTime(35, social, '09:00:00');
    expect(result).toBe('10:28');
  });
});
