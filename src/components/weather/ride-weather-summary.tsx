import { WeatherIcon } from '@/components/weather/weather-icon';
import { appContent } from '@/content/app';
import { getConditionColorClass } from '@/config/weather';
import { units } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { RideWeatherSnapshot } from '@/types/database';

const { weather: weatherContent } = appContent;

interface RideWeatherSummaryProps {
  weather: RideWeatherSnapshot | null;
}

/**
 * Compact weather summary row for the ride detail page.
 * Shows icon + temperature + feels-like + chance of rain.
 */
export function RideWeatherSummary({ weather }: RideWeatherSummaryProps) {
  if (!weather || weather.temperature_c == null) return null;

  const temp = Math.round(weather.temperature_c);
  const feelsLike = Math.round(weather.feels_like_c ?? weather.temperature_c);
  const popPercent = weather.pop != null ? Math.round(weather.pop * 100) : null;

  return (
    <div className="mt-3 flex items-center gap-2">
      <WeatherIcon
        weatherCode={weather.weather_code}
        isDay={weather.is_day}
        className={cn('size-5', getConditionColorClass(weather.weather_code, weather.is_day))}
      />
      <span className="font-display text-lg font-semibold text-foreground">
        {temp}
        {units.celsius}
      </span>
      <span className="text-[0.8125rem] text-muted-foreground">
        {weatherContent.feelsLike(feelsLike)}
        {popPercent != null && (
          <>
            <span className="mx-1.5">·</span>
            {weatherContent.detail.chanceOfRain}: {popPercent}
            {units.percent}
          </>
        )}
      </span>
    </div>
  );
}
