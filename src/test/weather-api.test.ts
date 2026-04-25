import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchForecastForRide } from '@/lib/weather/api';

type FetchMock = ReturnType<typeof vi.fn>;

const buildHourlyResponse = (
  times: string[],
  overrides: Partial<Record<string, number[]>> = {},
) => {
  const len = times.length;
  const fill = (v: number) => Array.from({ length: len }, () => v);
  return {
    hourly: {
      time: times,
      temperature_2m: overrides.temperature_2m ?? fill(15),
      apparent_temperature: overrides.apparent_temperature ?? fill(14),
      precipitation_probability: overrides.precipitation_probability ?? fill(20),
      precipitation: overrides.precipitation ?? fill(0),
      weather_code: overrides.weather_code ?? fill(1),
      wind_speed_10m: overrides.wind_speed_10m ?? fill(10),
      wind_gusts_10m: overrides.wind_gusts_10m ?? fill(15),
      relative_humidity_2m: overrides.relative_humidity_2m ?? fill(60),
      is_day: overrides.is_day ?? fill(1),
    },
  };
};

const mockFetch = (payload: unknown): FetchMock => {
  const fn = vi.fn(async () => ({
    ok: true,
    json: async () => payload,
    text: async () => '',
  }));
  vi.stubGlobal('fetch', fn);
  return fn;
};

describe('fetchForecastForRide', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests 8 forecast days so the 7-day-out boundary is covered', async () => {
    const fetchFn = mockFetch(buildHourlyResponse(['2026-05-02T06:00']));
    await fetchForecastForRide(43.65, -79.38, '2026-05-02', '06:00:00', 'America/Toronto');
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('forecast_days=8');
  });

  it('finds the exact hourly slot matching ride date/time', async () => {
    mockFetch(
      buildHourlyResponse(['2026-04-26T05:00', '2026-04-26T06:00', '2026-04-26T07:00'], {
        temperature_2m: [10, 18, 22],
      }),
    );
    const result = await fetchForecastForRide(
      43.65,
      -79.38,
      '2026-04-26',
      '06:00:00',
      'America/Toronto',
    );
    expect(result?.temperature_c).toBe(18);
  });

  it('falls back to the nearest hour within 90 minutes when no exact match', async () => {
    mockFetch(
      buildHourlyResponse(['2026-04-26T05:00', '2026-04-26T07:00'], {
        temperature_2m: [10, 22],
      }),
    );
    const result = await fetchForecastForRide(
      43.65,
      -79.38,
      '2026-04-26',
      '06:00:00',
      'America/Toronto',
    );
    expect(result?.temperature_c).toBeOneOf([10, 22]);
    expect(result).not.toBeNull();
  });

  it('returns null when the closest hour is more than 90 minutes away', async () => {
    mockFetch(buildHourlyResponse(['2026-04-26T00:00', '2026-04-26T12:00']));
    const result = await fetchForecastForRide(
      43.65,
      -79.38,
      '2026-04-26',
      '06:00:00',
      'America/Toronto',
    );
    expect(result).toBeNull();
  });

  it('handles a DST spring-forward gap by snapping to the nearest hour', async () => {
    // 2026-03-08 is the US/Canada spring-forward date; 02:00 local does not exist.
    mockFetch(
      buildHourlyResponse(['2026-03-08T01:00', '2026-03-08T03:00'], {
        temperature_2m: [5, 7],
      }),
    );
    const result = await fetchForecastForRide(
      43.65,
      -79.38,
      '2026-03-08',
      '02:00:00',
      'America/Toronto',
    );
    expect(result).not.toBeNull();
  });

  it('returns null and logs when the hourly array is empty', async () => {
    mockFetch({ hourly: { time: [] } });
    const result = await fetchForecastForRide(
      43.65,
      -79.38,
      '2026-04-26',
      '06:00:00',
      'America/Toronto',
    );
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it('passes the IANA timezone through to Open-Meteo', async () => {
    const fetchFn = mockFetch(buildHourlyResponse(['2026-04-26T06:00']));
    await fetchForecastForRide(43.65, -79.38, '2026-04-26', '06:00:00', 'America/Vancouver');
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('timezone=America%2FVancouver');
  });
});
