-- Remove organiser_notes column — organisers should use the comments section instead
ALTER TABLE rides DROP COLUMN IF EXISTS organiser_notes;
