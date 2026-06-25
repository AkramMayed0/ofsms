-- Migration 013: add profile JSONB column to orphans for extended case-study data
ALTER TABLE orphans
  ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}';
