'use client';

import { useState, useCallback, useMemo, type RefObject } from 'react';
import {
  MapTrifold,
  Path,
  Mountains,
  ArrowClockwise,
  MagnifyingGlass,
  LinkSimple,
  SpinnerGap,
} from '@phosphor-icons/react/dist/ssr';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingField } from '@/components/ui/floating-field';
import { EmptyState } from '@/components/ui/empty-state';
import { RoutePolylineThumbnail } from '@/components/rides/route-polyline-thumbnail';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { serviceIcons, serviceLabels } from '@/config/integrations';
import { units } from '@/config/formatting';
import { DATA_SM } from '@/components/rides/ride-card-parts';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const content = appContent.rides.importRoute;
const formContent = appContent.rides.form;

// ---------------------------------------------------------------------------
// Paste URL panel
// ---------------------------------------------------------------------------

export function PasteUrlPanel({
  pasteUrlRef,
  isFetchingRoute,
  fetchRouteError,
  onPasteUrl,
}: {
  pasteUrlRef: RefObject<HTMLInputElement | null>;
  isFetchingRoute: boolean;
  fetchRouteError: string | null;
  onPasteUrl: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Input
        ref={pasteUrlRef}
        type="url"
        placeholder={formContent.pasteRoutePlaceholder}
        disabled={isFetchingRoute}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isFetchingRoute}
        onClick={onPasteUrl}
        className="w-full gap-2"
      >
        {isFetchingRoute ? (
          <SpinnerGap className="size-4 animate-spin" />
        ) : (
          <>
            <LinkSimple className="size-4" />
            {formContent.addRouteButton}
          </>
        )}
      </Button>
      {fetchRouteError && <p className="text-xs text-destructive">{fetchRouteError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route list for a single service (Routes / Activities tabs)
// ---------------------------------------------------------------------------

export function ServiceRouteList({
  service,
  onSelect,
  showServiceBadge,
}: {
  service: IntegrationService;
  onSelect: (route: ImportableRoute) => void;
  showServiceBadge: boolean;
}) {
  return (
    <Tabs defaultValue="routes" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger value="routes" className="flex-1">
          {content.routesTab}
        </TabsTrigger>
        <TabsTrigger value="activities" className="flex-1">
          {content.activitiesTab}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="routes" className="flex min-h-0 flex-1 flex-col">
        <RouteListFetcher
          service={service}
          type="routes"
          onSelect={onSelect}
          showServiceBadge={showServiceBadge}
        />
      </TabsContent>
      <TabsContent value="activities" className="flex min-h-0 flex-1 flex-col">
        <RouteListFetcher
          service={service}
          type="activities"
          onSelect={onSelect}
          showServiceBadge={showServiceBadge}
        />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Fetcher — loads and renders routes from the API
// ---------------------------------------------------------------------------

function RouteListFetcher({
  service,
  type,
  onSelect,
  showServiceBadge,
}: {
  service: IntegrationService;
  type: 'routes' | 'activities';
  onSelect: (route: ImportableRoute) => void;
  showServiceBadge: boolean;
}) {
  const [routesList, setRoutesList] = useState<ImportableRoute[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    setSearchQuery('');
    fetchRoutes(1);
  }

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routesList;
    const q = searchQuery.toLowerCase();
    return routesList.filter((r) => r.name.toLowerCase().includes(q));
  }, [routesList, searchQuery]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => fetchRoutes(1)}>
          <ArrowClockwise className="mr-2 size-4" />
          {content.loadMore}
        </Button>
      </div>
    );
  }

  if (loading && !initialLoaded) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-10 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Search */}
      {routesList.length > 5 && (
        <FloatingField
          label={content.searchPlaceholder}
          htmlFor="route-search"
          hasValue={searchQuery.length > 0}
          icon={MagnifyingGlass}
          className="shrink-0"
        >
          <Input
            id="route-search"
            type="text"
            placeholder=" "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </FloatingField>
      )}

      {/* Route list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredRoutes.length === 0 && searchQuery.trim() ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {content.noSearchResults}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredRoutes.map((route) => (
              <RouteListItem
                key={route.id}
                route={route}
                showServiceBadge={showServiceBadge}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore && !searchQuery.trim() && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 shrink-0"
          disabled={loading}
          onClick={() => fetchRoutes(page + 1, true)}
        >
          {loading ? content.loading : content.loadMore}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual route item
// ---------------------------------------------------------------------------

function RouteListItem({
  route,
  showServiceBadge,
  onSelect,
}: {
  route: ImportableRoute;
  showServiceBadge: boolean;
  onSelect: (route: ImportableRoute) => void;
}) {
  const ServiceIcon = showServiceBadge ? serviceIcons[route.service] : null;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-transform hover:bg-action-primary-subtle-bg active:scale-[0.98]"
      onClick={() => onSelect(route)}
    >
      <RoutePolylineThumbnail encodedPolyline={route.polyline} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{route.name}</p>
        <div className="mt-1 flex items-center gap-3 text-muted-foreground">
          <span className={`flex items-center gap-1 ${DATA_SM}`}>
            <Path className="size-3" />
            {(route.distance_m / 1000).toFixed(1)}
            {units.km}
          </span>
          {route.elevation_m > 0 && (
            <span className={`flex items-center gap-1 ${DATA_SM}`}>
              <Mountains className="size-3" />
              {Math.round(route.elevation_m)}
              {units.m}
            </span>
          )}
          {ServiceIcon && <ServiceIcon className="ml-auto size-3 text-tertiary" />}
        </div>
      </div>
    </button>
  );
}
