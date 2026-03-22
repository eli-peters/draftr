import { WeatherIcon } from '@/components/weather/weather-icon';
import { getWeatherSeverity, getSeverityColorClass } from '@/config/weather';
import { units } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { RideWeatherSnapshot } from '@/types/database';

interface RideWeatherBadgeProps {
  weather: RideWeatherSnapshot | null;
  className?: string;
}

/**
 * Compact weather badge for ride cards.
 * Shows weather icon + temperature, and POP% when > 0.
 */
export function RideWeatherBadge({ weather, className }: RideWeatherBadgeProps) {
  if (!weather || weather.temperature_c == null) return null;

  const severity = getWeatherSeverity(weather.pop);
  const popPercent = weather.pop != null ? Math.round(weather.pop * 100) : null;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <WeatherIcon
        weatherCode={weather.weather_code}
        isDay={weather.is_day}
        className={cn('size-4', getSeverityColorClass(severity))}
      />

      <span className="font-mono text-[0.6875rem] font-semibold leading-4 text-muted-foreground">
        {Math.round(weather.temperature_c)}{units.celsius}
      </span>

      {popPercent != null && popPercent > 0 && (
        <span
          className={cn(
            'font-mono text-[0.6875rem] font-semibold leading-4',
            getSeverityColorClass(severity),
          )}
        >
          {popPercent}{units.percent}
        </span>
      )}
    </div>
  );
}
