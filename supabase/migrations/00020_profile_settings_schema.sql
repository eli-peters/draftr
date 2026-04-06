-- Add personal phone number and emergency contact relationship to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add admin notes and incident override to club memberships
ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS incident_override BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS: admin_notes is readable by admins only (already covered by existing row policies)
-- The existing RLS on club_memberships restricts writes to admins.
-- incident_override follows the same pattern — writable only by admins.

COMMENT ON COLUMN users.phone_number IS 'Personal contact phone number (E.164 format)';
COMMENT ON COLUMN users.emergency_contact_relationship IS 'Relationship to emergency contact (e.g. Spouse, Parent)';
COMMENT ON COLUMN club_memberships.admin_notes IS 'Internal admin-only notes about this member';
COMMENT ON COLUMN club_memberships.incident_override IS 'When true, bypasses time-windowed emergency contact access restrictions';
