-- Drop meeting_locations table and all FK references
-- Starting location is now derived from route data (start_location_name, start_location_address columns on rides)

-- 1. Drop FK columns from rides and ride_templates
ALTER TABLE rides DROP COLUMN IF EXISTS meeting_location_id;
ALTER TABLE ride_templates DROP COLUMN IF EXISTS meeting_location_id;

-- 2. Drop ride_pickups table (references meeting_locations, unused in app)
DROP TABLE IF EXISTS ride_pickups;

-- 3. Drop the meeting_locations table (RLS policies dropped automatically)
DROP TABLE IF EXISTS meeting_locations;
