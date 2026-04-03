'use client';

import { useState, type RefObject } from 'react';
import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import {
  MapTrifold,
  ArrowSquareOut,
  Trash,
  Path,
  LinkSimple,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { PasteUrlPanel } from '@/components/rides/route-import-inline';
import { StartLocationDisplay } from '@/components/rides/start-location-display';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { units } from '@/config/formatting';
import { knownServices, serviceIcons, serviceLabels, integrations } from '@/config/integrations';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const form = appContent.rides.form;
const { detail } = appContent.rides;
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
  distanceKm: string;
  elevationM: string;
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
  distanceKm,
  elevationM,
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
                  onClick={() => onClearRoute()}
                  className="shrink-0 rounded-full text-muted-foreground transition-transform hover:bg-destructive/10 hover:text-destructive active:scale-90"
                >
                  <Trash className="size-5" />
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
              {(distanceKm || elevationM) && (
                <div className="flex gap-3">
                  {distanceKm && (
                    <div className="flex flex-col items-start rounded-xl bg-accent-secondary-subtle px-4 py-3">
                      <span className="text-xs text-muted-foreground">{detail.distanceLabel}</span>
                      <span className="font-mono text-base font-medium text-foreground">
                        {distanceKm}
                        {units.km}
                      </span>
                    </div>
                  )}
                  {elevationM && (
                    <div className="flex flex-col items-start rounded-xl bg-accent-secondary-subtle px-4 py-3">
                      <span className="text-xs text-muted-foreground">{detail.elevationLabel}</span>
                      <span className="font-mono text-base font-medium text-foreground">
                        {elevationM}
                        {units.m}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
