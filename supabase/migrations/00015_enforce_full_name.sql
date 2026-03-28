-- Fix existing users who only have a first name
UPDATE users SET full_name = 'Alex Turner' WHERE id = '5e00600f-7974-4051-93d9-470b6220ea30' AND full_name = 'Alex';
UPDATE users SET full_name = 'Leo Marchetti' WHERE id = '75064912-ae78-48ac-8a20-6ca8071b2a07' AND full_name = 'Leo';
UPDATE users SET full_name = 'Riley Bennett' WHERE id = '8f8178fd-2aa4-4c09-85b3-b324d2dd1c93' AND full_name = 'Riley';

-- Enforce that onboarded users must have at least a first and last name.
-- Invite stubs (onboarding_completed = false) are exempt since they use email prefix as placeholder.
ALTER TABLE users ADD CONSTRAINT full_name_two_words
  CHECK (onboarding_completed = false OR full_name ~ '^\s*\S+\s+\S+');
