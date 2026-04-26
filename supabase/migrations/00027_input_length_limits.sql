-- Enforce character-count limits on every user-input text column.
-- Limits mirror src/lib/forms/limits.ts. Existing rows are truncated before the
-- CHECK constraints are applied so the migration cannot fail on legacy data.

-- Rides
UPDATE rides SET title = LEFT(title, 80) WHERE LENGTH(title) > 80;
ALTER TABLE rides
  ADD CONSTRAINT rides_title_max_length CHECK (LENGTH(title) <= 80);

UPDATE ride_templates SET title = LEFT(title, 80) WHERE LENGTH(title) > 80;
ALTER TABLE ride_templates
  ADD CONSTRAINT ride_templates_title_max_length CHECK (LENGTH(title) <= 80);

UPDATE rides
  SET cancellation_reason = LEFT(cancellation_reason, 300)
  WHERE cancellation_reason IS NOT NULL AND LENGTH(cancellation_reason) > 300;
ALTER TABLE rides
  ADD CONSTRAINT rides_cancellation_reason_max_length
  CHECK (cancellation_reason IS NULL OR LENGTH(cancellation_reason) <= 300);

-- Ride comments
UPDATE ride_comments SET body = LEFT(body, 500) WHERE LENGTH(body) > 500;
ALTER TABLE ride_comments
  ADD CONSTRAINT ride_comments_body_max_length CHECK (LENGTH(body) <= 500);

-- Announcements
UPDATE announcements SET title = LEFT(title, 120) WHERE LENGTH(title) > 120;
ALTER TABLE announcements
  ADD CONSTRAINT announcements_title_max_length CHECK (LENGTH(title) <= 120);

UPDATE announcements SET body = LEFT(body, 500) WHERE LENGTH(body) > 500;
ALTER TABLE announcements
  ADD CONSTRAINT announcements_body_max_length CHECK (LENGTH(body) <= 500);

-- Users — names. full_name is trigger-maintained from first_name + last_name + ' ',
-- so capping the source columns at 60 each gives a max length of 121 for full_name.
UPDATE users SET first_name = LEFT(first_name, 60) WHERE LENGTH(first_name) > 60;
ALTER TABLE users
  ADD CONSTRAINT users_first_name_max_length CHECK (LENGTH(first_name) <= 60);

UPDATE users SET last_name = LEFT(last_name, 60) WHERE LENGTH(last_name) > 60;
ALTER TABLE users
  ADD CONSTRAINT users_last_name_max_length CHECK (LENGTH(last_name) <= 60);

UPDATE users SET full_name = LEFT(full_name, 121) WHERE LENGTH(full_name) > 121;
ALTER TABLE users
  ADD CONSTRAINT users_full_name_max_length CHECK (LENGTH(full_name) <= 121);

-- Users — bio + emergency contact + pace preference
UPDATE users SET bio = LEFT(bio, 300) WHERE bio IS NOT NULL AND LENGTH(bio) > 300;
ALTER TABLE users
  ADD CONSTRAINT users_bio_max_length CHECK (bio IS NULL OR LENGTH(bio) <= 300);

UPDATE users
  SET emergency_contact_name = LEFT(emergency_contact_name, 100)
  WHERE emergency_contact_name IS NOT NULL AND LENGTH(emergency_contact_name) > 100;
ALTER TABLE users
  ADD CONSTRAINT users_emergency_contact_name_max_length
  CHECK (emergency_contact_name IS NULL OR LENGTH(emergency_contact_name) <= 100);

UPDATE users
  SET emergency_contact_relationship = LEFT(emergency_contact_relationship, 50)
  WHERE emergency_contact_relationship IS NOT NULL
    AND LENGTH(emergency_contact_relationship) > 50;
ALTER TABLE users
  ADD CONSTRAINT users_emergency_contact_relationship_max_length
  CHECK (emergency_contact_relationship IS NULL OR LENGTH(emergency_contact_relationship) <= 50);

UPDATE users
  SET preferred_pace_group = LEFT(preferred_pace_group, 60)
  WHERE preferred_pace_group IS NOT NULL AND LENGTH(preferred_pace_group) > 60;
ALTER TABLE users
  ADD CONSTRAINT users_preferred_pace_group_max_length
  CHECK (preferred_pace_group IS NULL OR LENGTH(preferred_pace_group) <= 60);

-- Users — address columns
UPDATE users
  SET street_address_line_1 = LEFT(street_address_line_1, 120)
  WHERE street_address_line_1 IS NOT NULL AND LENGTH(street_address_line_1) > 120;
ALTER TABLE users
  ADD CONSTRAINT users_street_address_line_1_max_length
  CHECK (street_address_line_1 IS NULL OR LENGTH(street_address_line_1) <= 120);

UPDATE users
  SET street_address_line_2 = LEFT(street_address_line_2, 120)
  WHERE street_address_line_2 IS NOT NULL AND LENGTH(street_address_line_2) > 120;
ALTER TABLE users
  ADD CONSTRAINT users_street_address_line_2_max_length
  CHECK (street_address_line_2 IS NULL OR LENGTH(street_address_line_2) <= 120);

UPDATE users SET city = LEFT(city, 80) WHERE city IS NOT NULL AND LENGTH(city) > 80;
ALTER TABLE users
  ADD CONSTRAINT users_city_max_length CHECK (city IS NULL OR LENGTH(city) <= 80);

UPDATE users
  SET province = LEFT(province, 80)
  WHERE province IS NOT NULL AND LENGTH(province) > 80;
ALTER TABLE users
  ADD CONSTRAINT users_province_max_length CHECK (province IS NULL OR LENGTH(province) <= 80);

-- postal_code already has a country-aware format check (00025); add a hard upper bound.
UPDATE users
  SET postal_code = LEFT(postal_code, 20)
  WHERE postal_code IS NOT NULL AND LENGTH(postal_code) > 20;
ALTER TABLE users
  ADD CONSTRAINT users_postal_code_max_length
  CHECK (postal_code IS NULL OR LENGTH(postal_code) <= 20);

-- country is enum-checked (CA / US) via 00025; the existing check already bounds length.
