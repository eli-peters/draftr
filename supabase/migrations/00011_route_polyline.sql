-- Add route_polyline column to rides and ride_templates
-- Stores Google-encoded polyline string from Strava/RWGPS for map rendering

ALTER TABLE rides ADD COLUMN route_polyline TEXT;
ALTER TABLE ride_templates ADD COLUMN default_route_polyline TEXT;
