import { getUserConnections } from '@/lib/integrations/queries';
import { IntegrationsSetting } from './integrations-setting';

/**
 * Async server component that independently fetches third-party connections
 * and renders the IntegrationsSetting card. Designed to be wrapped in a
 * Suspense boundary on the settings page so preferences and notifications
 * cards can paint before connections resolve.
 */
export async function IntegrationsSettingLoader({ userId }: { userId: string }) {
  const connections = await getUserConnections(userId);
  return <IntegrationsSetting connections={connections} />;
}
