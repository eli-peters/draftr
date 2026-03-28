import { CloudSlash, Drop } from '@phosphor-icons/react/dist/ssr';
import { WeatherIcon } from '@/components/weather/weather-icon';
import {
  getWeatherSeverity,
  getSeverityColorClass,
  getWeatherIconColorClass,
  POP_DISPLAY_THRESHOLD,
} from '@/config/weather';
import { appContent } from '@/content/app';
import { units } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { RideWeatherSnapshot } from '@/types/database';

interface RideWeatherBadgeProps {
  weather: RideWeatherSnapshot | null;
  /** 'inline' renders everything on one line for the card top row */
  layout?: 'default' | 'inline';
  className?: string;
}

/**
 * Compact weather badge for ride cards.
 * Default layout: icon + temp on one line, POP% below.
 * Inline layout: icon + temp + POP% all on one line (for card header row).
 */
export function RideWeatherBadge({
  weather,
  layout = 'default',
  className,
}: RideWeatherBadgeProps) {
  if (!weather || weather.temperature_c == null) {
    return (
      <div className={cn('flex items-center', className)} title={appContent.weather.unavailable}>
        <CloudSlash weight="duotone" className="size-4 text-text-tertiary" />
      </div>
    );
  }

  const severity = getWeatherSeverity(weather.pop);
  const popPercent = weather.pop != null ? Math.round(weather.pop * 100) : null;
  const showPop = popPercent != null && popPercent >= POP_DISPLAY_THRESHOLD;

  if (layout === 'inline') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <WeatherIcon
          weatherCode={weather.weather_code}
          isDay={weather.is_day}
          className={cn(
            'size-4',
            getWeatherIconColorClass(weather.weather_code, weather.is_day, severity),
          )}
        />
        <span className="font-mono text-compact font-semibold leading-4 text-muted-foreground">
          {Math.round(weather.temperature_c)}
          {units.celsius}
        </span>
        {showPop && (
          <span
            className={cn(
              'flex items-center gap-0.5 font-mono text-compact font-medium leading-4',
              getSeverityColorClass(severity),
            )}
          >
            <Drop weight="duotone" className="size-3" />
            {popPercent}
            {units.percent}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-end gap-0.5', className)}>
      <div className="flex items-center gap-1">
        <WeatherIcon
          weatherCode={weather.weather_code}
          isDay={weather.is_day}
          className={cn(
            'size-4',
            getWeatherIconColorClass(weather.weather_code, weather.is_day, severity),
          )}
        />
        <span className="font-mono text-compact font-semibold leading-4 text-muted-foreground">
          {Math.round(weather.temperature_c)}
          {units.celsius}
        </span>
      </div>

      {showPop && (
        <span
          className={cn(
            'flex items-center gap-0.5 font-mono text-xs font-medium leading-3',
            getSeverityColorClass(severity),
          )}
        >
          <Drop weight="duotone" className="size-3" />
          {popPercent}
          {units.percent}
        </span>
      )}
    </div>
  );
}
