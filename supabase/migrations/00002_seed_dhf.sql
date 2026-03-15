-- ============================================================================
-- Seed Data: Dark Horse Flyers
-- Run this AFTER 00001_core_schema.sql
-- ============================================================================

-- DHF Club
INSERT INTO clubs (name, slug, description, website_url, contact_email, timezone)
VALUES (
  'Dark Horse Flyers Cycling Club',
  'dark-horse-flyers',
  'Toronto''s friendliest cycling club, both on and off the bike.',
  'https://darkhorseflyers.ca',
  'hello@darkhorseflyers.ca',
  'America/Toronto'
);

-- Store the club ID for subsequent inserts
DO $$
DECLARE
  dhf_id UUID;
BEGIN
  SELECT id INTO dhf_id FROM clubs WHERE slug = 'dark-horse-flyers';

  -- ==========================================================================
  -- Pace Groups
  -- ==========================================================================

  INSERT INTO pace_groups (club_id, name, moving_pace_min, moving_pace_max, strava_pace_min, strava_pace_max, typical_distance_min, typical_distance_max, is_drop_ride, sort_order) VALUES
    (dhf_id, 'Social',           22.0, 26.0, 20.0, 24.0, 30, 50,  false, 1),
    (dhf_id, 'Intermediate B',   26.0, 29.0, 24.0, 27.0, 40, 70,  false, 2),
    (dhf_id, 'Intermediate A',   29.0, 32.0, 27.0, 30.0, 50, 80,  false, 3),
    (dhf_id, 'Advanced B',       32.0, 35.0, 30.0, 33.0, 60, 100, true,  4),
    (dhf_id, 'Advanced A',       35.0, 38.0, 33.0, 36.0, 70, 120, true,  5),
    (dhf_id, 'Elite',            38.0, NULL, 36.0, NULL, 80, 150, true,  6);

  -- ==========================================================================
  -- Meeting Locations
  -- ==========================================================================

  INSERT INTO meeting_locations (club_id, name, address, latitude, longitude, notes) VALUES
    (dhf_id, 'DH Canary',          'Canary District, Toronto',           43.6580, -79.3510, 'Main DHF meeting point'),
    (dhf_id, 'DH East',            'East Toronto',                       43.6700, -79.3200, NULL),
    (dhf_id, 'DH Spadina',         'Spadina Ave, Toronto',               43.6530, -79.3980, NULL),
    (dhf_id, 'Pottery Road',       'Pottery Road, Toronto',              43.6770, -79.3600, NULL),
    (dhf_id, 'Princes'' Gates/CNE','Princes'' Gates, Exhibition Place',  43.6330, -79.4170, 'Near Lakeshore'),
    (dhf_id, 'Colborne Lodge',     'Colborne Lodge Dr, High Park',       43.6390, -79.4630, NULL),
    (dhf_id, 'Roadkit',            'Roadkit Cycling Cafe',               43.6650, -79.3380, NULL);

  -- ==========================================================================
  -- Tags
  -- ==========================================================================

  INSERT INTO tags (club_id, name, color, sort_order) VALUES
    (dhf_id, 'Fast',              '#C10F33', 1),
    (dhf_id, 'Social',            '#0085B6', 2),
    (dhf_id, 'Hills',             '#86142F', 3),
    (dhf_id, 'Gravel',            '#6B7280', 4),
    (dhf_id, 'Beginner-Friendly', '#10B981', 5),
    (dhf_id, 'MTB',               '#8B5CF6', 6),
    (dhf_id, 'Mixed Surface',     '#F59E0B', 7),
    (dhf_id, 'No-Drop',           '#0085B6', 8),
    (dhf_id, 'DROP',              '#C10F33', 9),
    (dhf_id, 'Nuke',              '#EF4444', 10),
    (dhf_id, 'Skills',            '#6366F1', 11);

  -- ==========================================================================
  -- Weather Rules (DHF defaults)
  -- ==========================================================================

  INSERT INTO weather_rules (club_id, name, rain_probability_threshold, wind_speed_threshold, humidex_max, aqhi_threshold, is_default) VALUES
    (dhf_id, 'Cancel',        70, 40, 40.0, 7, true),
    (dhf_id, 'Weather Watch',  50, 30, 35.0, 4, false);

END $$;
