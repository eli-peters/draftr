'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapTrifold, Path, Mountains, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StravaIcon, RwgpsIcon } from '@/components/icons/service-icons';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const content = appContent.rides.importRoute;

const serviceLabels: Record<IntegrationService, string> = {
  strava: 'Strava',
  ridewithgps: 'Ride with GPS',
};

const serviceIcons: Record<
  IntegrationService,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  strava: StravaIcon,
  ridewithgps: RwgpsIcon,
};

interface RouteImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedServices: IntegrationService[];
  onSelect: (route: ImportableRoute) => void;
}

export function RouteImportDrawer({
  open,
  onOpenChange,
  connectedServices,
  onSelect,
}: RouteImportDrawerProps) {
  const router = useRouter();

  if (connectedServices.length === 0) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{content.heading}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <EmptyState
              icon={MapTrifold}
              title={content.noConnections.title}
              description={content.noConnections.description}
            >
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  onOpenChange(false);
                  router.push(routes.profile);
                }}
              >
                {content.noConnections.connectButton}
              </Button>
            </EmptyState>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const defaultService = connectedServices[0];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{content.heading}</DrawerTitle>
          <DrawerDescription>{content.description}</DrawerDescription>
        </DrawerHeader>

        <Tabs defaultValue={defaultService} className="px-4 pb-4">
          {connectedServices.length > 1 && (
            <TabsList className="w-full">
              {connectedServices.map((service) => {
                const Icon = serviceIcons[service];
                return (
                  <TabsTrigger key={service} value={service} className="flex-1">
                    <Icon className="size-3.5" />
                    {serviceLabels[service]}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          )}

          {connectedServices.map((service) => (
            <TabsContent key={service} value={service}>
              <ServiceRouteList service={service} onSelect={onSelect} />
            </TabsContent>
          ))}
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Route list for a single service
// ---------------------------------------------------------------------------

function ServiceRouteList({
  service,
  onSelect,
}: {
  service: IntegrationService;
  onSelect: (route: ImportableRoute) => void;
}) {
  const [sourceType, setSourceType] = useState<'routes' | 'activities'>('routes');

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Routes / Activities toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={sourceType === 'routes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceType('routes')}
        >
          {content.routesTab}
        </Button>
        <Button
          type="button"
          variant={sourceType === 'activities' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceType('activities')}
        >
          {content.activitiesTab}
        </Button>
      </div>

      <RouteListFetcher service={service} type={sourceType} onSelect={onSelect} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fetcher — loads and renders routes from the API
// ---------------------------------------------------------------------------

function RouteListFetcher({
  service,
  type,
  onSelect,
}: {
  service: IntegrationService;
  type: 'routes' | 'activities';
  onSelect: (route: ImportableRoute) => void;
}) {
  const [routesList, setRoutesList] = useState<ImportableRoute[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ service, type, page: String(pageNum) });
        const res = await fetch(`${routes.importRoutes}?${params}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.expired) {
            setError(content.errorDisconnected(serviceLabels[service]));
          } else {
            setError(content.errorFetch);
          }
          return;
        }

        const data = await res.json();
        setRoutesList((prev) => (append ? [...prev, ...data.routes] : data.routes));
        setHasMore(data.hasMore);
        setPage(pageNum);
        setInitialLoaded(true);
      } catch {
        setError(content.errorFetch);
      } finally {
        setLoading(false);
      }
    },
    [service, type],
  );

  // Load on first render and when service/type changes
  const [prevKey, setPrevKey] = useState('');
  const key = `${service}:${type}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setRoutesList([]);
    setHasMore(true);
    setInitialLoaded(false);
    setError(null);
    fetchRoutes(1);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => fetchRoutes(1)}>
          <ArrowClockwise className="mr-1.5 size-3.5" />
          {content.loadMore}
        </Button>
      </div>
    );
  }

  if (loading && !initialLoaded) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (initialLoaded && routesList.length === 0) {
    const emptyContent = type === 'routes' ? content.noRoutes : content.noActivities;
    return (
      <EmptyState
        icon={MapTrifold}
        title={emptyContent.title}
        description={emptyContent.description}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="max-h-[40vh] overflow-y-auto">
        {routesList.map((route) => (
          <button
            key={route.id}
            type="button"
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
            onClick={() => onSelect(route)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{route.name}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Path className="size-3" />
                  {(route.distance_m / 1000).toFixed(1)} km
                </span>
                {route.elevation_m > 0 && (
                  <span className="flex items-center gap-1">
                    <Mountains className="size-3" />
                    {Math.round(route.elevation_m)} m
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1"
          disabled={loading}
          onClick={() => fetchRoutes(page + 1, true)}
        >
          {loading ? content.loading : content.loadMore}
        </Button>
      )}
    </div>
  );
}
