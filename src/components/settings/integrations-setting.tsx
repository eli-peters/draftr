'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { LinkBreak, LinkSimple, PlugsConnected } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ContentCard } from '@/components/ui/content-card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from '@/components/ui/alert-dialog';
import { settingsContent } from '@/content/settings';
import { integrations, serviceIcons } from '@/config/integrations';
import { initiateConnect, disconnectService } from '@/lib/integrations/actions';
import type { ConnectionInfo } from '@/lib/integrations/queries';
import type { IntegrationService } from '@/types/database';

const content = settingsContent.connections;

interface IntegrationsSettingProps {
  connections: ConnectionInfo[];
}

export function IntegrationsSetting({ connections }: IntegrationsSettingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show toast for connection status from callback redirect
  useEffect(() => {
    const integration = searchParams.get('integration');
    const status = searchParams.get('status');
    if (!integration || !status) return;

    const displayName = integrations[integration as IntegrationService]?.displayName ?? integration;

    if (status === 'connected') {
      toast.success(content.connectSuccess(displayName));
    } else if (status === 'error') {
      toast.error(content.connectError(displayName));
    }

    // Clean up URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('integration');
    url.searchParams.delete('status');
    router.replace(url.pathname, { scroll: false });
  }, [searchParams, router]);

  // Build list of available services
  const services = Object.values(integrations);

  return (
    <ContentCard icon={PlugsConnected} heading={content.title} subtitle={content.subtitle}>
      <div className="divide-y divide-border">
        {services.map((config) => {
          const connection = connections.find((c) => c.service === config.service);
          return (
            <ServiceRow
              key={config.service}
              service={config.service}
              displayName={config.displayName}
              brandColor={config.brandColor}
              connection={connection ?? null}
            />
          );
        })}
      </div>
    </ContentCard>
  );
}

// ---------------------------------------------------------------------------
// Per-service row
// ---------------------------------------------------------------------------

interface ServiceRowProps {
  service: IntegrationService;
  displayName: string;
  brandColor: string;
  connection: ConnectionInfo | null;
}

function ServiceRow({ service, displayName, brandColor, connection }: ServiceRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const isLoading = isPending || isRedirecting;
  const ServiceIcon = serviceIcons[service];

  function handleConnect() {
    startTransition(async () => {
      const result = await initiateConnect(service);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      setIsRedirecting(true);
      window.location.href = result.redirectUrl;
    });
  }

  function handleConfirmDisconnect() {
    setDisconnectOpen(false);
    startTransition(async () => {
      const result = await disconnectService(service);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(content.disconnectSuccess(displayName));
    });
  }

  if (connection) {
    return (
      <>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9">
              {connection.avatar_url && (
                <AvatarImage src={connection.avatar_url} alt={connection.display_name ?? ''} />
              )}
              <AvatarFallback
                className="flex items-center justify-center text-text-on-primary"
                style={{ backgroundColor: brandColor }}
              >
                <ServiceIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {connection.display_name
                  ? content.connectedAs(connection.display_name)
                  : content.connected}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisconnectOpen(true)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <LinkBreak className="h-4 w-4" />
            {isLoading ? content.disconnecting : content.disconnectButton}
          </Button>
        </div>
        <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{content.disconnectConfirmTitle(displayName)}</AlertDialogTitle>
              <AlertDialogDescription>
                {content.disconnectConfirm(displayName)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                {content.cancel}
              </AlertDialogClose>
              <Button variant="destructive" onClick={handleConfirmDisconnect}>
                {content.disconnectButton}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-on-primary"
          style={{ backgroundColor: brandColor }}
        >
          <ServiceIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">{displayName}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleConnect}
        disabled={isLoading}
        className="shrink-0"
      >
        <LinkSimple className="h-4 w-4" />
        {isLoading ? content.connecting : content.connectButton(displayName)}
      </Button>
    </div>
  );
}
