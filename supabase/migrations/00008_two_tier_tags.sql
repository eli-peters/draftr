-- ============================================================================
-- Two-Tier Tag System: Pace Tags (colored) + Vibe Tags (gray)
-- Adds color to pace_groups, archive support to tags, and replaces seed tags
-- with the curated vibe tag taxonomy.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Pace groups gain a color column for admin-configurable tier colors
-- --------------------------------------------------------------------------
ALTER TABLE pace_groups ADD COLUMN IF NOT EXISTS color TEXT;

-- Seed warm-spectrum colors for existing DHF pace groups
UPDATE pace_groups SET color = '#22C55E' WHERE name = 'Social'           AND color IS NULL;
UPDATE pace_groups SET color = '#84CC16' WHERE name = 'Intermediate B'   AND color IS NULL;
UPDATE pace_groups SET color = '#EAB308' WHERE name = 'Intermediate A'   AND color IS NULL;
UPDATE pace_groups SET color = '#F97316' WHERE name = 'Advanced B'       AND color IS NULL;
UPDATE pace_groups SET color = '#EF4444' WHERE name = 'Advanced A'       AND color IS NULL;
UPDATE pace_groups SET color = '#DC2626' WHERE name = 'Elite'            AND color IS NULL;

-- --------------------------------------------------------------------------
-- 2. Tags gain an is_archived flag for retire/archive functionality
-- --------------------------------------------------------------------------
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- --------------------------------------------------------------------------
-- 3. Replace ad-hoc seed tags with curated vibe tag taxonomy
--    Vibe tags have no color (always rendered as gray chips).
-- --------------------------------------------------------------------------
DO $$
DECLARE
  dhf_id UUID;
BEGIN
  SELECT id INTO dhf_id FROM clubs WHERE slug = 'dark-horse-flyers';

  -- Only proceed if DHF club exists (seed data scenario)
  IF dhf_id IS NOT NULL THEN
    -- Remove ride_tags referencing old DHF tags
    DELETE FROM ride_tags
    WHERE tag_id IN (SELECT id FROM tags WHERE club_id = dhf_id);

    -- Remove old DHF tags
    DELETE FROM tags WHERE club_id = dhf_id;

    -- Insert curated vibe tag taxonomy (14 tags, no color)
    INSERT INTO tags (club_id, name, color, sort_order, is_archived) VALUES
      -- Social contract
      (dhf_id, 'No-drop',               NULL, 1,  false),
      (dhf_id, 'Beginner-friendly',     NULL, 2,  false),
      (dhf_id, 'Women''s ride',         NULL, 3,  false),
      (dhf_id, 'Recovery',              NULL, 4,  false),
      -- Terrain feel
      (dhf_id, 'Flat',                  NULL, 5,  false),
      (dhf_id, 'Rolling',               NULL, 6,  false),
      (dhf_id, 'Punchy climbs',         NULL, 7,  false),
      (dhf_id, 'Long climbs',           NULL, 8,  false),
      (dhf_id, 'Mixed surface',         NULL, 9,  false),
      -- Logistics
      (dhf_id, 'Coffee stop',           NULL, 10, false),
      (dhf_id, 'Post-ride social',      NULL, 11, false),
      (dhf_id, 'Photo-friendly',        NULL, 12, false),
      (dhf_id, 'Transit-accessible start', NULL, 13, false),
      -- Format
      (dhf_id, 'Training ride',         NULL, 14, false);
  END IF;
END $$;
