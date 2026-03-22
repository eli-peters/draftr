import { Wind, Drop, CloudRain } from '@phosphor-icons/react/dist/ssr';
import { WeatherIcon } from '@/components/weather/weather-icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import { getWeatherCondition, getWeatherSeverity, getSeverityColorClass } from '@/config/weather';
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
    <div className="mt-8">
      <SectionHeading>{weatherContent.detail.heading}</SectionHeading>

      {severity === 'severe' && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-base text-destructive">
          <CloudRain className="h-5 w-5 shrink-0" />
          {weatherContent.severeWarning}
        </div>
      )}

      <div className="mt-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <WeatherIcon
            weatherCode={weather.weather_code}
            isDay={weather.is_day}
            className="size-10 text-muted-foreground"
          />
          <div>
            <span className="text-lg font-semibold text-foreground">{condition.label}</span>
            <p className="text-sm text-muted-foreground">
              {weatherContent.feelsLike(Math.round(weather.feels_like_c ?? weather.temperature_c))}
            </p>
          </div>
          <span className="ml-auto font-mono text-2xl font-bold text-foreground">
            {Math.round(weather.temperature_c)}{units.celsius}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {weather.wind_speed_kmh != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="size-4 shrink-0" />
              <span>
                {weatherContent.detail.wind}: {Math.round(weather.wind_speed_kmh)}{units.kmh}
                {weather.wind_gust_kmh != null && (
                  <span className="text-muted-foreground/70">
                    {' '}({weatherContent.detail.gusts}: {Math.round(weather.wind_gust_kmh)}{units.kmh})
                  </span>
                )}
              </span>
            </div>
          )}

          {weather.humidity != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Drop className="size-4 shrink-0" />
              <span>
                {weatherContent.detail.humidity}: {weather.humidity}{units.percent}
              </span>
            </div>
          )}

          {popPercent != null && (
            <div className="flex items-center gap-2 text-sm">
              <CloudRain className={cn('size-4 shrink-0', severityClass)} />
              <span className={cn(severity !== 'normal' && 'font-medium', severityClass)}>
                {weatherContent.detail.chanceOfRain}: {popPercent}{units.percent}
              </span>
            </div>
          )}

          {weather.precipitation_mm != null && weather.precipitation_mm > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Drop className="size-4 shrink-0" />
              <span>
                {weatherContent.detail.precipitation}: {weather.precipitation_mm}{units.mm}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
