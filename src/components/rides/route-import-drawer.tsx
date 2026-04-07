'use client';

import { DrawerBody, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { ServiceRouteList } from '@/components/rides/route-import-inline';
import { appContent } from '@/content/app';
import { serviceIcons, serviceLabels, integrations } from '@/config/integrations';
import type { IntegrationService, ImportableRoute } from '@/types/database';

const content = appContent.rides.importRoute;

interface RouteImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: IntegrationService;
  connectedServices: IntegrationService[];
  onSelect: (route: ImportableRoute) => void;
}

export function RouteImportDrawer({
  open,
  onOpenChange,
  service,
  connectedServices,
  onSelect,
}: RouteImportDrawerProps) {
  const Icon = serviceIcons[service];
  const brandColor = integrations[service].brandColor;

  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange} size="lg" className="overflow-clip">
      <DrawerHeader className="flex flex-row items-center gap-3 group-data-[vaul-drawer-direction=right]/drawer-content:pr-12 group-data-[vaul-drawer-direction=left]/drawer-content:pr-12">
        <div className="flex size-8 items-center justify-center" style={{ color: brandColor }}>
          <Icon className="size-5" />
        </div>
        <DrawerTitle>{serviceLabels[service]}</DrawerTitle>
      </DrawerHeader>

      <DrawerBody className="flex flex-col">
        <DrawerDescription className="shrink-0 pb-3 text-xs text-muted-foreground">
          {content.modes[service].connected}
        </DrawerDescription>
        <ServiceRouteList
          key={service}
          service={service}
          onSelect={(route) => {
            onSelect(route);
            onOpenChange(false);
          }}
          showServiceBadge={connectedServices.length > 1}
        />
      </DrawerBody>
    </ResponsiveDrawer>
  );
}
