import { MapTrifold, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { appContent } from '@/content/app';
import { parseRouteUrl } from '@/lib/rides/parse-route-url';
import { serviceLabels } from '@/config/integrations';

const { detail } = appContent.rides;

interface RouteMapPlaceholderProps {
  routeUrl: string | null;
}

/**
 * Placeholder for the route map when no polyline data is available.
 * Shows a tappable card linking to the external route when a URL exists,
 * or a static placeholder otherwise.
 */
export function RouteMapPlaceholder({ routeUrl }: RouteMapPlaceholderProps) {
  const parsed = routeUrl ? parseRouteUrl(routeUrl) : null;
  const serviceName = parsed ? serviceLabels[parsed.service] : null;

  const content = (
    <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-surface-sunken">
      <MapTrifold weight="duotone" className="size-6 text-muted-foreground/40" />
      {routeUrl ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-info">
          {serviceName ? detail.viewRouteOn(serviceName) : detail.viewRoute}
          <ArrowSquareOut className="size-3.5" />
        </span>
      ) : (
        <span className="text-body-sm text-muted-foreground/60">{detail.routeMapPlaceholder}</span>
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
