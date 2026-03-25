import { MapTrifold, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { appContent } from '@/content/app';

const { detail } = appContent.rides;

interface RouteMapPlaceholderProps {
  routeUrl: string | null;
  routeName: string | null;
}

/**
 * Placeholder for the route map embed (Strava / RideWithGPS).
 * Shows a tappable gray box when a route URL exists, or a static placeholder otherwise.
 * Will be replaced with a real map embed once route API integration lands.
 */
export function RouteMapPlaceholder({ routeUrl, routeName }: RouteMapPlaceholderProps) {
  const content = (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-surface-sunken">
      <MapTrifold weight="duotone" className="size-10 text-muted-foreground/40" />
      <span className="text-[0.8125rem] text-muted-foreground/60">
        {detail.routeMapPlaceholder}
      </span>
      {routeUrl && routeName && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-info">
          {routeName}
          <ArrowSquareOut className="size-3.5" />
        </span>
      )}
    </div>
  );

  if (routeUrl) {
    return (
      <a href={routeUrl} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}
