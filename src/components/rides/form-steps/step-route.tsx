'use client';

import { useState, type RefObject } from 'react';
import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import {
  MapTrifold,
  ArrowSquareOut,
  PencilSimple,
  Path,
  LinkSimple,
  MapPin,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { buildDirectionsUrl } from '@/lib/maps/directions';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { PasteUrlPanel } from '@/components/rides/route-import-inline';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { knownServices, serviceIcons, serviceLabels, integrations } from '@/config/integrations';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const form = appContent.rides.form;
const importContent = appContent.rides.importRoute;

interface StepRouteProps {
  importedRouteName: string | null;
  routePolyline: string;
  routeUrl: string;
  detectedService: IntegrationService | null;
  connectedServices: IntegrationService[];
  onSelectRoute: (route: ImportableRoute) => void;
  onClearRoute: (preserveUrl?: boolean) => void;
  pasteUrlRef: RefObject<HTMLInputElement | null>;
  isFetchingRoute: boolean;
  fetchRouteError: string | null;
  onPasteUrl: () => void;
  routeError?: string;
  startLocationName: string;
  startLocationAddress: string;
  startLatitude: number | null;
  startLongitude: number | null;
  isGeocodingLocation: boolean;
}

export function StepRoute({
  importedRouteName,
  routePolyline,
  routeUrl,
  detectedService,
  connectedServices,
  onSelectRoute,
  onClearRoute,
  pasteUrlRef,
  isFetchingRoute,
  fetchRouteError,
  onPasteUrl,
  routeError,
  startLocationName,
  startLocationAddress,
  startLatitude,
  startLongitude,
  isGeocodingLocation,
}: StepRouteProps) {
  // Local UI state: which inline panel is expanded (paste or disconnected service prompt)
  const [expandedInline, setExpandedInline] = useState<'paste' | IntegrationService | null>(null);
  // Which service drawer is open
  const [drawerService, setDrawerService] = useState<IntegrationService | null>(null);

  const handleCardClick = (service: IntegrationService) => {
    if (connectedServices.includes(service)) {
      // Connected → open drawer for this service
      setDrawerService(service);
      setExpandedInline(null);
    } else {
      // Disconnected → toggle inline connect prompt
      setExpandedInline((prev) => (prev === service ? null : service));
    }
  };

  const handlePasteClick = () => {
    setExpandedInline((prev) => (prev === 'paste' ? null : 'paste'));
    setDrawerService(null);
  };

  return (
    <ContentCard
      padding="default"
      heading={form.sectionRoute}
      icon={<Path weight="duotone" className="size-6 text-primary" />}
    >
      <div className="flex flex-col gap-5 min-w-0">
        {importedRouteName ? (
          !routePolyline && detectedService ? (
            /* Link-only preview */
            <div className="rounded-xl bg-surface-sunken p-4 space-y-3">
              <div className="rounded-lg bg-surface-page flex flex-col items-center justify-center gap-1.5 py-6">
                <MapTrifold weight="duotone" className="size-8 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground/60">
                  {form.linkOnlyPreviewLabel}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-info">
                  {form.linkOnlyViewRoute(serviceLabels[detectedService])}
                  <ArrowSquareOut className="size-3" />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.linkOnlyHint(serviceLabels[detectedService])}
              </p>
              <div className="flex items-center justify-between">
                <Link
                  href={routes.profile}
                  className="text-xs font-medium text-info hover:underline"
                >
                  {form.linkOnlyConnect(serviceLabels[detectedService])}
                </Link>
                <Button type="button" variant="ghost" size="sm" onClick={() => onClearRoute()}>
                  {form.linkOnlyRemove}
                </Button>
              </div>
              <StartLocationDisplay
                name={startLocationName}
                address={startLocationAddress}
                latitude={startLatitude}
                longitude={startLongitude}
                isGeocoding={isGeocodingLocation}
                hasRoute
              />
            </div>
          ) : (
            /* Route imported — confirmation + map */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapTrifold className="size-5 shrink-0 text-primary" weight="duotone" />
                  <p className="text-sm font-medium text-foreground truncate">
                    {form.importConfirmed(importedRouteName)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onClearRoute(true)}
                  className="shrink-0 rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                >
                  <PencilSimple className="size-5" />
                </Button>
              </div>
              {routePolyline && (
                <RouteMapLoader
                  polylineStr={routePolyline}
                  routeUrl={routeUrl || null}
                  routeName={importedRouteName}
                  aspectRatio="5/2"
                />
              )}
              <StartLocationDisplay
                name={startLocationName}
                address={startLocationAddress}
                latitude={startLatitude}
                longitude={startLongitude}
                isGeocoding={isGeocodingLocation}
                hasRoute
              />
            </div>
          )
        ) : (
          /* No route yet — service cards + inline paste / connect prompts */
          <div className="space-y-3">
            <p className="text-center text-body-sm text-muted-foreground">
              {form.importDescription}
            </p>

            {/* Service cards */}
            <div className="grid grid-cols-3 gap-3">
              {knownServices.map((service) => {
                const Icon = serviceIcons[service];
                const brandColor = integrations[service].brandColor;
                const isConnected = connectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleCardClick(service)}
                    className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all active:scale-[0.97] ${
                      isConnected
                        ? 'bg-surface-page hover:bg-accent/50'
                        : expandedInline === service
                          ? 'border-2 border-dashed border-primary bg-transparent'
                          : 'border-2 border-dashed border-border bg-transparent hover:bg-accent/30'
                    }`}
                  >
                    <Icon className="size-6" style={{ color: brandColor }} />
                    <span className="text-xs font-medium text-foreground">
                      {serviceLabels[service]}
                    </span>
                    {!isConnected && (
                      <span className="text-caption-sm text-muted-foreground">
                        {form.serviceNotConnected}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handlePasteClick}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-all active:scale-[0.97] ${
                  expandedInline === 'paste'
                    ? 'ring-2 ring-primary bg-surface-page'
                    : 'bg-surface-page hover:bg-accent/50'
                }`}
              >
                <LinkSimple className="size-6 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {importContent.modes.paste.heading}
                </span>
              </button>
            </div>

            {/* Inline expansion: paste URL or disconnected service prompt */}
            {expandedInline && (
              <div className="animate-in fade-in-0 duration-200">
                {expandedInline === 'paste' ? (
                  <PasteUrlPanel
                    pasteUrlRef={pasteUrlRef}
                    isFetchingRoute={isFetchingRoute}
                    fetchRouteError={fetchRouteError}
                    onPasteUrl={onPasteUrl}
                  />
                ) : (
                  /* Disconnected service — connect prompt */
                  <div className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      {importContent.modes[expandedInline].notConnected}
                    </p>
                    <Link href={routes.profile}>
                      <Button type="button" variant="outline" size="sm">
                        {importContent.modes[expandedInline].connectButton}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {routeError && (
          <p className="text-sm text-destructive" aria-invalid="true">
            {routeError}
          </p>
        )}
      </div>

      {/* Single-service route drawer */}
      {drawerService && (
        <RouteImportDrawer
          open={!!drawerService}
          onOpenChange={(open) => {
            if (!open) setDrawerService(null);
          }}
          service={drawerService}
          connectedServices={connectedServices}
          onSelect={onSelectRoute}
        />
      )}
    </ContentCard>
  );
}

// ---------------------------------------------------------------------------
// Start location display — read-only, derived from route
// ---------------------------------------------------------------------------

function StartLocationDisplay({
  name,
  address,
  latitude,
  longitude,
  isGeocoding,
  hasRoute,
}: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isGeocoding: boolean;
  hasRoute: boolean;
}) {
  if (isGeocoding) {
    return <p className="text-body-sm text-muted-foreground">{form.startLocationFromRoute}</p>;
  }

  if (name) {
    const directionsUrl = buildDirectionsUrl({ latitude, longitude, address, name });
    const Wrapper = directionsUrl ? 'a' : 'div';
    const wrapperProps = directionsUrl
      ? { href: directionsUrl, target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};
    return (
      <Wrapper {...wrapperProps} className="group flex items-start gap-2">
        <MapPin weight="duotone" className="mt-0.5 size-6 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold tracking-[-0.015em] text-foreground decoration-primary/30 underline-offset-2 group-hover:underline">
            {name}
          </p>
          {address && <p className="mt-0.5 text-body-sm text-muted-foreground">{address}</p>}
        </div>
      </Wrapper>
    );
  }

  if (hasRoute) {
    return (
      <div className="flex items-start gap-2">
        <MapPin weight="duotone" className="mt-0.5 size-6 shrink-0 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{form.startLocationUnavailable}</p>
      </div>
    );
  }

  return null;
}
