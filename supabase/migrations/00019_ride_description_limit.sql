-- Enforce 250-character limit on ride descriptions.
-- Truncate existing descriptions that exceed the limit before adding the constraint.

UPDATE rides
SET description = LEFT(description, 250)
WHERE description IS NOT NULL AND LENGTH(description) > 250;

UPDATE ride_templates
SET description = LEFT(description, 250)
WHERE description IS NOT NULL AND LENGTH(description) > 250;

ALTER TABLE rides
  ADD CONSTRAINT rides_description_max_length CHECK (LENGTH(description) <= 250);

ALTER TABLE ride_templates
  ADD CONSTRAINT ride_templates_description_max_length CHECK (LENGTH(description) <= 250);
