-- ============================================================
-- OFSMS Migration 008 — Fix orphans table column names
-- Renames dob → date_of_birth to match the service layer
-- Adds missing notes column
-- ============================================================

ALTER TABLE orphans RENAME COLUMN dob TO date_of_birth;
ALTER TABLE orphans ADD COLUMN IF NOT EXISTS notes TEXT;