-- Add user_preferences JSONB column for per-user display settings.
-- Stores units and time format. Privacy/motion/map/ride-default keys were
-- considered but descoped for MVP — they can be reintroduced additively
-- without touching this migration.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{
    "distance_unit": "km",
    "elevation_unit": "m",
    "temperature_unit": "celsius",
    "time_format": "24h"
  }'::jsonb;

COMMENT ON COLUMN users.user_preferences IS
  'Per-user display preferences (units, time format). Merged with app-layer defaults when keys are absent.';
