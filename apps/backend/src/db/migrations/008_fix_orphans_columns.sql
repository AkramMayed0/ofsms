-- ============================================================
-- OFSMS Migration 008 — Fix orphans table column names
-- Renames dob → date_of_birth to match the service layer
-- Adds missing notes column
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orphans' AND column_name = 'dob'
  ) THEN
    ALTER TABLE orphans RENAME COLUMN dob TO date_of_birth;
  END IF;
END $$;

ALTER TABLE orphans ADD COLUMN IF NOT EXISTS notes TEXT;