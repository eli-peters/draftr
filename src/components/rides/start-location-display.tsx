import { MapPin } from '@phosphor-icons/react/dist/ssr';
import { buildDirectionsUrl } from '@/lib/maps/directions';
import { shortenAddress } from '@/lib/utils';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

interface StartLocationDisplayProps {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isGeocoding?: boolean;
  /** Whether a route is attached — controls the "unavailable" fallback */
  hasRoute?: boolean;
}

export function StartLocationDisplay({
  name,
  address,
  latitude,
  longitude,
  isGeocoding,
  hasRoute,
}: StartLocationDisplayProps) {
  if (isGeocoding) {
    return <p className="text-status-label text-muted-foreground">{form.startLocationFromRoute}</p>;
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
          <p className="truncate font-display text-xl font-semibold text-foreground decoration-primary/30 underline-offset-2 group-hover:underline">
            {name}
          </p>
          {address && (
            <p className="mt-0.5 select-text text-status-label text-muted-foreground">
              {shortenAddress(address)}
            </p>
          )}
        </div>
      </Wrapper>
    );
  }

  if (hasRoute) {
    return (
      <div className="flex items-start gap-2">
        <MapPin weight="duotone" className="mt-0.5 size-6 shrink-0 text-muted-foreground/70" />
        <p className="text-sm text-muted-foreground">{form.startLocationUnavailable}</p>
      </div>
    );
  }

  return null;
}
