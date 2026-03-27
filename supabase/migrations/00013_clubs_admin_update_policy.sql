-- ============================================================================
-- Add UPDATE policy on clubs for admins
-- Was missing: no UPDATE policy existed, causing updateSeasonDates (and any
-- other admin club updates) to silently persist nothing via RLS.
-- ============================================================================

CREATE POLICY "Admins can update their club"
  ON clubs FOR UPDATE
  USING (is_club_admin(id, auth.uid()))
  WITH CHECK (is_club_admin(id, auth.uid()));
