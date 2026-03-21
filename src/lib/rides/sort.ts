import type { SortOption } from '@/components/rides/ride-filter-drawer';

/** Minimal shape required for ride sorting. */
interface Sortable {
  ride_date: string;
  start_time: string;
  distance_km: number | null;
}

/** Sort a ride array by the given option. Returns a new array. */
export function sortRides<T extends Sortable>(rides: T[], sortBy: SortOption): T[] {
  return [...rides].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.ride_date.localeCompare(b.ride_date) || a.start_time.localeCompare(b.start_time);
      case 'date_desc':
        return b.ride_date.localeCompare(a.ride_date) || b.start_time.localeCompare(a.start_time);
      case 'distance_asc':
        return (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity);
      case 'distance_desc':
        return (b.distance_km ?? 0) - (a.distance_km ?? 0);
      default:
        return 0;
    }
  });
}
