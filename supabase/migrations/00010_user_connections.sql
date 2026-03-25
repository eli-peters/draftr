-- External Service Connections (Strava, RideWithGPS, etc.)
-- Stores OAuth tokens and cached profile data for each connected service.
-- Generic table supporting multiple services per user.

-- ---------------------------------------------------------------------------
-- Connection table
-- ---------------------------------------------------------------------------
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,                -- 'strava', 'ridewithgps'
  external_user_id TEXT NOT NULL,       -- service-specific user/athlete ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  profile_data JSONB,                   -- cached profile (name, avatar, etc.)
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service),             -- one connection per service per user
  UNIQUE(service, external_user_id)     -- prevent same ext account linking to multiple users
);

CREATE INDEX idx_user_connections_user ON user_connections(user_id);

-- ---------------------------------------------------------------------------
-- RLS: users read/delete own rows; INSERT/UPDATE via admin client only
-- (callback routes + token refresh use service role)
-- ---------------------------------------------------------------------------
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connections"
  ON user_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own connections"
  ON user_connections FOR DELETE
  USING (user_id = auth.uid());
