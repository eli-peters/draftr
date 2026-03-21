-- ============================================================================
-- Announcement Types, Dismissibility & Persistent Dismissal Tracking
-- Extends announcements with severity types (info/warning/danger/success),
-- admin-controlled dismissibility, auto-expiry guardrails, and a table
-- for tracking which members have dismissed which announcements.
-- ============================================================================

-- Add type, dismissibility, and auto-expiry guardrail columns
ALTER TABLE announcements
  ADD COLUMN announcement_type TEXT NOT NULL DEFAULT 'info'
    CONSTRAINT announcements_type_check CHECK (announcement_type IN ('info', 'warning', 'danger', 'success')),
  ADD COLUMN is_dismissible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN max_duration_days INTEGER NOT NULL DEFAULT 30;

-- ============================================================================
-- Announcement Dismissals: tracks which members have dismissed each announcement
-- ============================================================================

CREATE TABLE announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Fast lookup: "has this user dismissed this announcement?"
CREATE INDEX idx_announcement_dismissals_lookup
  ON announcement_dismissals(user_id, announcement_id);

-- ============================================================================
-- RLS for announcement_dismissals
-- ============================================================================

ALTER TABLE announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Members can check their own dismissal state
CREATE POLICY "Users can view own dismissals"
  ON announcement_dismissals FOR SELECT
  USING (user_id = auth.uid());

-- Members can dismiss announcements (insert their own row)
CREATE POLICY "Users can dismiss announcements"
  ON announcement_dismissals FOR INSERT
  WITH CHECK (user_id = auth.uid());
