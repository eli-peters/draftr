'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
  const isMobile = useIsMobile();
  const Icon = serviceIcons[service];
  const brandColor = integrations[service].brandColor;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent className="overflow-clip data-[vaul-drawer-direction=bottom]:h-[80vh] data-[vaul-drawer-direction=right]:h-full data-[vaul-drawer-direction=left]:h-full">
        <DrawerHeader className="flex flex-row items-center gap-3 pr-12">
          <div className="flex size-8 items-center justify-center" style={{ color: brandColor }}>
            <Icon className="size-5" />
          </div>
          <DrawerTitle>{serviceLabels[service]}</DrawerTitle>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <p className="shrink-0 pb-3 text-xs text-muted-foreground">
            {content.modes[service].connected}
          </p>
          <ServiceRouteList
            key={service}
            service={service}
            onSelect={(route) => {
              onSelect(route);
              onOpenChange(false);
            }}
            showServiceBadge={connectedServices.length > 1}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
