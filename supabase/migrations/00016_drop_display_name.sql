-- Remove the display_name column from users.
-- All name display now uses full_name exclusively.
ALTER TABLE public.users DROP COLUMN IF EXISTS display_name;
