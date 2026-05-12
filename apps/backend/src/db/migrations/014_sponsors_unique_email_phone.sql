-- ============================================================
-- OFSMS Migration 014 — Add UNIQUE constraints on sponsors email & phone
-- Depends on: 003_sponsors.sql
-- Prevents duplicate sponsors from being created with the same email or phone.
-- ============================================================

-- Add unique constraint on email (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sponsors_email_key' AND conrelid = 'sponsors'::regclass
  ) THEN
    ALTER TABLE sponsors ADD CONSTRAINT sponsors_email_key UNIQUE (email);
  END IF;
END $$;

-- Add unique constraint on phone (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sponsors_phone_key' AND conrelid = 'sponsors'::regclass
  ) THEN
    ALTER TABLE sponsors ADD CONSTRAINT sponsors_phone_key UNIQUE (phone);
  END IF;
END $$;

-- ── Users: phone must be unique (nullable — multiple NULLs allowed) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_phone_key' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;
