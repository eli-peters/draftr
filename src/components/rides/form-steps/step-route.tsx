'use client';

import { useState, type RefObject } from 'react';
import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import {
  MapTrifold,
  ArrowSquareOut,
  Path,
  LinkSimple,
  SpinnerGap,
  UploadSimple,
  Mountains,
  Info,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RouteMapLoader } from '@/components/rides/route-map-loader';
import { RouteImportDrawer } from '@/components/rides/route-import-drawer';
import { StartLocationDisplay } from '@/components/rides/start-location-display';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { units } from '@/config/formatting';
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
  const [drawerService, setDrawerService] = useState<IntegrationService | null>(null);
  const [showPasteInput, setShowPasteInput] = useState(false);

  return (
    <ContentCard padding="default" heading={form.sectionRoute} icon={Path}>
      <div className="flex flex-col gap-4 min-w-0">
        {importedRouteName ? (
          !routePolyline && detectedService ? (
            /* Link-only preview */
            <div className="rounded-xl bg-surface-sunken p-4 space-y-3">
              <div className="rounded-lg bg-surface-page flex flex-col items-center justify-center gap-1.5 py-6">
                <MapTrifold weight="duotone" className="size-8 text-(--text-tertiary)" />
                <span className="text-xs text-(--text-tertiary)">{form.linkOnlyPreviewLabel}</span>
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {importedRouteName}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    &middot;{' '}
                    {detectedService
                      ? form.viaService(serviceLabels[detectedService])
                      : form.viaLink}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onClearRoute()}
                  className="shrink-0 text-muted-foreground"
                >
                  {form.importChange}
                </Button>
              </div>
              {routePolyline && (
                <RouteMapLoader
                  polylineStr={routePolyline}
                  routeUrl={routeUrl || null}
                  routeName={importedRouteName}
                  aspectRatio="2.39/1"
                />
              )}
              <div className="mt-4">
                <StartLocationDisplay
                  name={startLocationName}
                  address={startLocationAddress}
                  latitude={startLatitude}
                  longitude={startLongitude}
                  isGeocoding={isGeocodingLocation}
                  hasRoute
                />
              </div>
              {(distanceKm || elevationM) && (
                <>
                  <div className="my-4 border-t border-border" />
                  <div className="space-y-1">
                    {distanceKm && (
                      <div className="flex items-center gap-2 text-base text-foreground">
                        <Path className="size-4 shrink-0 text-muted-foreground" />
                        <span className="tabular-nums">
                          {distanceKm}
                          {units.km}
                        </span>
                      </div>
                    )}
                    {elevationM && (
                      <div className="flex items-center gap-2 text-base text-foreground">
                        <Mountains className="size-4 shrink-0 text-muted-foreground" />
                        <span className="tabular-nums">
                          {elevationM}
                          {units.m}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        ) : (
          /* No route yet — service pills + paste input on demand */
          <div className="space-y-3">
            <p className="text-center text-body-sm text-muted-foreground">
              {form.importDescription}
            </p>

            {/* Service pills — horizontal row */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {knownServices.map((service) => {
                const Icon = serviceIcons[service];
                const brandColor = integrations[service].brandColor;
                const isConnected = connectedServices.includes(service);

                if (isConnected) {
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setDrawerService(service)}
                      className="inline-flex items-center gap-2 rounded-full bg-surface-page px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50 active:scale-[0.97]"
                    >
                      <Icon className="size-4" style={{ color: brandColor }} />
                      {serviceLabels[service]}
                    </button>
                  );
                }

                return (
                  <Link
                    key={service}
                    href={routes.profile}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/30"
                  >
                    <Icon className="size-4 opacity-50" />
                    {serviceLabels[service]}
                    <span className="text-xs">
                      &middot; {importContent.modes[service].connectButton}
                    </span>
                  </Link>
                );
              })}

              {/* Paste link pill */}
              <button
                type="button"
                onClick={() => setShowPasteInput((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-surface-page px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50 active:scale-[0.97]"
              >
                <LinkSimple className="size-4 text-muted-foreground" />
                {importContent.modes.paste.heading}
              </button>

              {/* GPX upload pill — coming soon */}
              <span className="inline-flex cursor-default items-center gap-2 rounded-full bg-surface-page px-4 py-2 text-sm font-medium opacity-50">
                <UploadSimple className="size-4 text-muted-foreground" />
                {importContent.modes.gpx.heading}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-medium leading-none text-muted-foreground">
                  {importContent.modes.gpx.comingSoon}
                </span>
              </span>
            </div>

            {/* Paste input — shown on pill click */}
            {showPasteInput && (
              <div className="animate-in fade-in-0 space-y-2.5 duration-200">
                <div className="relative">
                  <Input
                    ref={pasteUrlRef}
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    placeholder={form.pasteRoutePlaceholder}
                    disabled={isFetchingRoute}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isFetchingRoute}
                    onClick={onPasteUrl}
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                  >
                    {isFetchingRoute ? (
                      <SpinnerGap className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-info/10 px-3 py-2.5">
                  <Info weight="fill" className="mt-0.5 size-3.5 shrink-0 text-info" />
                  <p className="text-xs leading-relaxed text-info">{form.pasteLinkHelper}</p>
                </div>
                {fetchRouteError && <p className="text-xs text-destructive">{fetchRouteError}</p>}
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
