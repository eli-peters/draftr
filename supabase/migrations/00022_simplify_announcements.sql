-- Simplify announcements to title + message only.
-- Banner type, manual expiry, and dismissible toggle are removed.
-- All announcements are now always dismissible (announcement_dismissals table stays).
-- Auto-expiry is handled by the existing max_duration_days guardrail in queries.
ALTER TABLE announcements
  DROP COLUMN IF EXISTS announcement_type,
  DROP COLUMN IF EXISTS is_dismissible,
  DROP COLUMN IF EXISTS expires_at;
