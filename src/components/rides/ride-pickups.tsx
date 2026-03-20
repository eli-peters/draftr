import { Clock } from '@phosphor-icons/react/dist/ssr';
import { appContent } from '@/content/app';
import type { RidePickupWithLocation } from '@/types/database';

const { pickups: pickupsContent } = appContent.rides;

interface RidePickupsProps {
  pickups: RidePickupWithLocation[];
}

export function RidePickups({ pickups }: RidePickupsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-muted-foreground mb-3">{pickupsContent.heading}</p>
      <div className="space-y-3">
        {pickups.map((pickup, i) => (
          <div key={pickup.id} className="flex items-start gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-3.5 w-3.5 text-primary" weight="bold" />
              </div>
              {i < pickups.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {pickup.pickup_time.slice(0, 5)}
                </span>
                <span className="text-sm text-foreground">{pickup.location.name}</span>
              </div>
              {pickup.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">{pickup.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
