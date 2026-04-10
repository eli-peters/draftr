-- Restore a purpose-built announcement type column with 3 values
-- that map to real club communication modes (replacing the removed
-- info/warning/danger/success taxonomy).
ALTER TABLE announcements
  ADD COLUMN announcement_type TEXT NOT NULL DEFAULT 'general'
    CONSTRAINT announcements_type_check
      CHECK (announcement_type IN ('general', 'event', 'urgent'));
