-- ============================================================
-- OFSMS Migration 012 — Agent Batch Confirmations
-- Depends on: 007_create_disbursements.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_batch_confirmations (
  list_id UUID NOT NULL REFERENCES disbursement_lists(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY (list_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_conf_agent ON agent_batch_confirmations(agent_id);
CREATE INDEX IF NOT EXISTS idx_batch_conf_list ON agent_batch_confirmations(list_id);
