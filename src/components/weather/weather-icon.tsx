import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

interface WeatherIconProps {
  weatherCode: number | null;
  isDay?: boolean | null;
  className?: string;
}

/**
 * Maps WMO weather condition codes to Phosphor duotone icons.
 * Uses day/night variants for clear and partly cloudy conditions.
 */
export function WeatherIcon({ weatherCode, isDay = true, className }: WeatherIconProps) {
  const iconClass = cn('shrink-0', className);

  if (weatherCode == null) return <Cloud weight="duotone" className={iconClass} />;
  if (weatherCode === 0)
    return isDay ? (
      <Sun weight="duotone" className={iconClass} />
    ) : (
      <Moon weight="duotone" className={iconClass} />
    );
  if (weatherCode <= 2)
    return isDay ? (
      <CloudSun weight="duotone" className={iconClass} />
    ) : (
      <CloudMoon weight="duotone" className={iconClass} />
    );
  if (weatherCode === 3) return <Cloud weight="duotone" className={iconClass} />;
  if (weatherCode === 45 || weatherCode === 48)
    return <CloudFog weight="duotone" className={iconClass} />;
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82))
    return <CloudRain weight="duotone" className={iconClass} />;
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86))
    return <CloudSnow weight="duotone" className={iconClass} />;
  if (weatherCode >= 95) return <CloudLightning weight="duotone" className={iconClass} />;

  return <Cloud weight="duotone" className={iconClass} />;
}
