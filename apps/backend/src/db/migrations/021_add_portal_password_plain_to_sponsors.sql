-- OFSMS Migration 021 - Add portal_password_plain column to sponsors
-- Allows the General Manager (head of system) to view and manage sponsor portal passwords.

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS portal_password_plain VARCHAR(255);

-- Set a default fallback plain password for existing test/seed sponsors if currently NULL
UPDATE sponsors
SET portal_password_plain = 'Sponsor@1234'
WHERE portal_password_plain IS NULL;
