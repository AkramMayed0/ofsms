-- OFSMS Migration 022 - Create periodic_evaluations table
-- Researcher periodic evaluation (تقييم الباحث الدوري) for orphans and families.

CREATE TABLE IF NOT EXISTS periodic_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type VARCHAR(20) NOT NULL CHECK (beneficiary_type IN ('orphan', 'family')),
  beneficiary_id UUID NOT NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_name VARCHAR(100),
  show_in_sponsor_portal BOOLEAN DEFAULT TRUE,
  overall_score NUMERIC(5,2) DEFAULT 0,
  criteria_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  general_summary TEXT,
  recommendations TEXT,
  researcher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_periodic_evaluations_beneficiary 
  ON periodic_evaluations(beneficiary_type, beneficiary_id);

CREATE INDEX IF NOT EXISTS idx_periodic_evaluations_date 
  ON periodic_evaluations(evaluation_date DESC);
