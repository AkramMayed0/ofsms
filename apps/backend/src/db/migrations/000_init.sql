-- ============================================================
-- OFSMS Migration 000 — Database initialization
-- Run once after provisioning the Supabase project
-- ============================================================
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable unaccented text search (useful for Arabic name search)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── Enum types ───────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'agent',
  'supervisor',
  'finance',
  'gm',
  'sponsor'
);

CREATE TYPE beneficiary_status AS ENUM (
  'under_review',
  'under_marketing',
  'under_sponsorship',
  'rejected',
  'inactive'
);

CREATE TYPE quran_report_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE disbursement_status AS ENUM (
  'draft',
  'supervisor_approved',
  'finance_approved',
  'released',
  'rejected'
);

-- ── Governorates (lookup) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS governorates (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL
);

INSERT INTO
  governorates (name_ar, name_en)
VALUES
  ('أمانة العاصمة', 'Amanat Al Asimah'),
  ('صنعاء', 'Sana''a'),
  ('عدن', 'Aden'),
  ('تعز', 'Taiz'),
  ('الحديدة', 'Hudaydah'),
  ('إب', 'Ibb'),
  ('حجة', 'Hajjah'),
  ('ذمار', 'Dhamar'),
  ('البيضاء', 'Al Bayda'),
  ('شبوة', 'Shabwah'),
  ('مأرب', 'Marib'),
  ('الجوف', 'Al Jawf'),
  ('عمران', 'Amran'),
  ('المحويت', 'Al Mahwit'),
  ('ريمة', 'Raymah'),
  ('لحج', 'Lahij'),
  ('أبين', 'Abyan'),
  ('الضالع', 'Ad Dali'),
  ('حضرموت', 'Hadhramaut'),
  ('المهرة', 'Al Mahrah'),
  ('سقطرى', 'Socotra'),
  ('صعدة', 'Saada') ON CONFLICT DO NOTHING;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ── Audit log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE
  SET
    NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ── updated_at auto-trigger ───────────────────────────────────
CREATE
OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE
UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Verify with: SELECT count(*) FROM governorates; → 22 ─────