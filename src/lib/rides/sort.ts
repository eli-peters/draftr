/** Minimal shape required for ride filtering. */
interface Filterable {
  pace_group?: { id: string } | null;
  pace_group_id?: string | null;
}

/** Filter rides by pace group IDs. Returns a new array. */
export function filterRides<T extends Filterable>(rides: T[], paceIds: string[]): T[] {
  return rides.filter((ride) => {
    if (paceIds.length > 0) {
      const rideGroupId = ride.pace_group?.id ?? ride.pace_group_id;
      if (!rideGroupId || !paceIds.includes(rideGroupId)) return false;
    }
    return true;
  });
}
