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
 * Maps WMO weather condition codes to Phosphor icons.
 * Uses day/night variants for clear and partly cloudy conditions.
 */
export function WeatherIcon({ weatherCode, isDay = true, className }: WeatherIconProps) {
  const iconClass = cn('shrink-0', className);

  if (weatherCode == null) return <Cloud className={iconClass} />;
  if (weatherCode === 0)
    return isDay ? <Sun className={iconClass} /> : <Moon className={iconClass} />;
  if (weatherCode <= 2)
    return isDay ? <CloudSun className={iconClass} /> : <CloudMoon className={iconClass} />;
  if (weatherCode === 3) return <Cloud className={iconClass} />;
  if (weatherCode === 45 || weatherCode === 48) return <CloudFog className={iconClass} />;
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82))
    return <CloudRain className={iconClass} />;
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86))
    return <CloudSnow className={iconClass} />;
  if (weatherCode >= 95) return <CloudLightning className={iconClass} />;

  return <Cloud className={iconClass} />;
}
