-- ============================================================
-- Migration: 001_create_users.sql
-- Description: Users table for all internal staff roles
-- Roles: agent | supervisor | finance | gm
-- Note: Sponsors have a separate table with separate auth
-- ============================================================



-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL,
  phone         VARCHAR(30),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique  ON users (email);
CREATE        INDEX IF NOT EXISTS users_role_idx      ON users (role);
CREATE        INDEX IF NOT EXISTS users_is_active_idx ON users (is_active);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Seed: initial GM account for first login
-- Email:    admin@ofsms.local
-- Password: Admin@1234   ← CHANGE THIS IMMEDIATELY after setup
-- Hash generated with bcrypt cost=12
-- ============================================================
INSERT INTO users (full_name, email, password_hash, role, phone)
VALUES (
  'مدير النظام',
  'admin@ofsms.local',
  '$2b$12$bUsgTfDtYDb9pF/wVDNOuur4CB8QCGjrj4YtrCsurW.Ll/XvKdDTu',
  'gm',
  NULL
)
ON CONFLICT (email) DO NOTHING;
