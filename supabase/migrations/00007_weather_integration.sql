-- Weather Integration
-- Adds weather snapshot storage for rides and tracking for automated
-- weather watch status changes.

-- ---------------------------------------------------------------------------
-- Weather snapshot per ride (upserted on each sync)
-- ---------------------------------------------------------------------------
CREATE TABLE ride_weather_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperature_c DECIMAL(4,1),
  feels_like_c DECIMAL(4,1),
  humidity INTEGER,
  wind_speed_kmh DECIMAL(5,1),
  wind_gust_kmh DECIMAL(5,1),
  pop DECIMAL(3,2),                -- probability of precipitation (0.00–1.00)
  precipitation_mm DECIMAL(5,1),
  weather_code INTEGER,            -- OpenWeatherMap condition code
  weather_main TEXT,               -- "Clear", "Clouds", "Rain", etc.
  weather_icon TEXT,               -- OWM icon code ("01d", "10n", etc.)
  is_day BOOLEAN,
  source TEXT NOT NULL DEFAULT 'open-meteo',
  UNIQUE(ride_id)
);

CREATE INDEX idx_ride_weather_ride ON ride_weather_snapshots(ride_id);

-- ---------------------------------------------------------------------------
-- Track whether weather_watch was set automatically
-- (so manual weather watch set by a leader is never overridden)
-- ---------------------------------------------------------------------------
ALTER TABLE rides ADD COLUMN weather_watch_auto BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- RLS: readable by authenticated club members, writable by service role only
-- ---------------------------------------------------------------------------
ALTER TABLE ride_weather_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can read ride weather"
  ON ride_weather_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rides r
    JOIN club_memberships cm ON cm.club_id = r.club_id
    WHERE r.id = ride_weather_snapshots.ride_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  ));
