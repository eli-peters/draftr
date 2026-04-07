import { Wind, Drop, CloudRain } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { StatusCallout } from '@/components/ui/status-callout';
import { WeatherIcon } from '@/components/weather/weather-icon';
import { appContent } from '@/content/app';
import {
  getWeatherCondition,
  getWeatherSeverity,
  getSeverityColorClass,
  getConditionColorClass,
} from '@/config/weather';
import { units } from '@/config/formatting';
import { cn } from '@/lib/utils';
import type { RideWeatherSnapshot } from '@/types/database';

const { weather: weatherContent } = appContent;

interface RideWeatherDetailProps {
  weather: RideWeatherSnapshot | null;
}

/**
 * Detailed weather section for the ride detail page.
 * Shows full forecast breakdown with condition, temperature, wind, humidity, and POP.
 */
export function RideWeatherDetail({ weather }: RideWeatherDetailProps) {
  if (!weather || weather.temperature_c == null) return null;

  const condition = getWeatherCondition(weather.weather_code);
  const severity = getWeatherSeverity(weather.pop);
  const popPercent = weather.pop != null ? Math.round(weather.pop * 100) : null;
  const severityClass = getSeverityColorClass(severity);

  return (
    <ContentCard padding="spacious" className="mt-8" heading={weatherContent.detail.heading}>
      {severity === 'severe' && (
        <StatusCallout tone="error" className="mb-3 flex items-center gap-2.5 px-5 py-4 text-base">
          <CloudRain className="h-5 w-5 shrink-0" />
          {weatherContent.severeWarning}
        </StatusCallout>
      )}
      <div className="flex items-center gap-3">
        <WeatherIcon
          weatherCode={weather.weather_code}
          isDay={weather.is_day}
          className={cn('size-10', getConditionColorClass(weather.weather_code, weather.is_day))}
        />
        <div>
          <span className="text-lg font-semibold text-foreground">{condition.label}</span>
          <p className="text-sm text-muted-foreground">
            {weatherContent.feelsLike(Math.round(weather.feels_like_c ?? weather.temperature_c))}
          </p>
        </div>
        <span className="ml-auto font-mono text-2xl font-bold text-foreground">
          {Math.round(weather.temperature_c)}
          {units.celsius}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {weather.wind_speed_kmh != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="size-4 shrink-0" />
            <span>
              {weatherContent.detail.wind}: {Math.round(weather.wind_speed_kmh)}
              {units.kmh}
              {weather.wind_gust_kmh != null && (
                <span className="text-muted-foreground/70">
                  {' '}
                  ({weatherContent.detail.gusts}: {Math.round(weather.wind_gust_kmh)}
                  {units.kmh})
                </span>
              )}
            </span>
          </div>
        )}

        {weather.humidity != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Drop className="size-4 shrink-0" />
            <span>
              {weatherContent.detail.humidity}: {weather.humidity}
              {units.percent}
            </span>
          </div>
        )}

        {popPercent != null && (
          <div className="flex items-center gap-2 text-sm">
            <CloudRain className={cn('size-4 shrink-0', severityClass)} />
            <span className={cn(severity !== 'normal' && 'font-medium', severityClass)}>
              {weatherContent.detail.chanceOfRain}: {popPercent}
              {units.percent}
            </span>
          </div>
        )}

        {weather.precipitation_mm != null && weather.precipitation_mm > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Drop className="size-4 shrink-0" />
            <span>
              {weatherContent.detail.precipitation}: {weather.precipitation_mm}
              {units.mm}
            </span>
          </div>
        )}
      </div>
    </ContentCard>
  );
}
