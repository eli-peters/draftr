-- ============================================================================
-- 00025: User Profile Expansion & External Memberships
--
-- 1A. Split full_name into first_name + last_name (trigger-maintained)
-- 1B. Add demographic and address columns to users
-- 1C. Create memberships table (external CCN/OCA tracking)
-- 1D. Create membership_club_affiliations junction table
-- ============================================================================

-- ============================================================================
-- PART 1A: Split full_name into first_name + last_name
-- ============================================================================

-- Add first_name and last_name columns (nullable initially for data migration)
ALTER TABLE users
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT;

-- Populate from existing full_name data
-- Split on first space: everything before → first_name, everything after → last_name
-- Single-word names (invite stubs) → first_name only, empty last_name
UPDATE users SET
  first_name = CASE
    WHEN position(' ' IN trim(full_name)) > 0
      THEN left(trim(full_name), position(' ' IN trim(full_name)) - 1)
    ELSE trim(full_name)
  END,
  last_name = CASE
    WHEN position(' ' IN trim(full_name)) > 0
      THEN substring(trim(full_name) FROM position(' ' IN trim(full_name)) + 1)
    ELSE ''
  END;

-- Drop the full_name_two_words constraint (from migration 00015)
-- No longer needed — name validation moves to first_name/last_name
ALTER TABLE users DROP CONSTRAINT IF EXISTS full_name_two_words;

-- Now that data is populated, enforce NOT NULL
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;

-- Create trigger function to keep full_name in sync
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := trim(NEW.first_name || ' ' || NEW.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger — fires on every INSERT and on UPDATE of first_name or last_name
CREATE TRIGGER trg_sync_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

COMMENT ON COLUMN users.first_name IS 'Given name, split from original full_name';
COMMENT ON COLUMN users.last_name IS 'Family name, split from original full_name';

-- ============================================================================
-- PART 1B: Add demographic and address columns to users
-- ============================================================================

ALTER TABLE users
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN gender TEXT,
  ADD COLUMN street_address_line_1 TEXT,
  ADD COLUMN street_address_line_2 TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN province TEXT,
  ADD COLUMN postal_code TEXT,
  ADD COLUMN country TEXT;

-- Gender constraint
ALTER TABLE users ADD CONSTRAINT users_gender_check
  CHECK (gender IN ('male', 'female'));

-- Country constraint
ALTER TABLE users ADD CONSTRAINT users_country_check
  CHECK (country IN ('CA', 'US'));

-- Postal code format validation based on country
-- Only fires when both postal_code and country are non-null
ALTER TABLE users ADD CONSTRAINT users_postal_code_format_check
  CHECK (
    postal_code IS NULL
    OR country IS NULL
    OR (country = 'CA' AND postal_code ~ '^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$')
    OR (country = 'US' AND postal_code ~ '^\d{5}(-\d{4})?$')
  );

COMMENT ON COLUMN users.date_of_birth IS 'Date of birth for membership eligibility';
COMMENT ON COLUMN users.gender IS 'male or female';
COMMENT ON COLUMN users.street_address_line_1 IS 'Primary street address';
COMMENT ON COLUMN users.street_address_line_2 IS 'Apartment, suite, unit, etc.';
COMMENT ON COLUMN users.city IS 'City';
COMMENT ON COLUMN users.province IS 'Province (CA) or state (US)';
COMMENT ON COLUMN users.postal_code IS 'Postal code (CA) or ZIP code (US), format validated by country';
COMMENT ON COLUMN users.country IS 'CA or US';

-- ============================================================================
-- PART 1C: Create memberships table (external CCN/OCA tracking)
-- ============================================================================

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_number TEXT,
  membership_type TEXT,
  membership_subtype TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, member_number)
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_memberships_user ON memberships(user_id);

-- ============================================================================
-- PART 1D: Create membership_club_affiliations junction table
-- ============================================================================

CREATE TABLE membership_club_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(membership_id, club_id)
);

ALTER TABLE membership_club_affiliations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_membership_club_affiliations_membership
  ON membership_club_affiliations(membership_id);
CREATE INDEX idx_membership_club_affiliations_club
  ON membership_club_affiliations(club_id);

-- ============================================================================
-- PART 1E: RLS policies (after both tables exist)
-- ============================================================================

-- Memberships: authenticated users can view
CREATE POLICY "Authenticated users can view memberships"
  ON memberships FOR SELECT
  USING (auth.role() = 'authenticated');

-- Memberships: admins can insert (must be admin of at least one club)
CREATE POLICY "Admins can insert memberships"
  ON memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
  );

-- Memberships: admins can update memberships affiliated with their club
CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM membership_club_affiliations mca
      JOIN club_memberships cm ON cm.club_id = mca.club_id
      WHERE mca.membership_id = memberships.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.status = 'active'
    )
  );

-- Memberships: admins can delete memberships affiliated with their club
CREATE POLICY "Admins can delete memberships"
  ON memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM membership_club_affiliations mca
      JOIN club_memberships cm ON cm.club_id = mca.club_id
      WHERE mca.membership_id = memberships.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.status = 'active'
    )
  );

-- Affiliations: club members can view
CREATE POLICY "Members can view club affiliations"
  ON membership_club_affiliations FOR SELECT
  USING (is_club_member(club_id, auth.uid()));

-- Affiliations: admins can manage
CREATE POLICY "Admins can insert club affiliations"
  ON membership_club_affiliations FOR INSERT
  WITH CHECK (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can update club affiliations"
  ON membership_club_affiliations FOR UPDATE
  USING (is_club_admin(club_id, auth.uid()));

CREATE POLICY "Admins can delete club affiliations"
  ON membership_club_affiliations FOR DELETE
  USING (is_club_admin(club_id, auth.uid()));
