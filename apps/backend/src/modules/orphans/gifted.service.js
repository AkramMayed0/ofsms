/**
 * gifted.service.js
 * Database queries for gifted orphan management.
 * Covers FR-056 → FR-059.
 */

const { query } = require('../../config/db');

/**
 * Mark an orphan as gifted (or remove the flag).
 * Only GM can call this — enforced at the route level.
 *
 * @param {string}  orphanId
 * @param {boolean} isGifted
 * @returns {Object} updated orphan row
 */
const setGiftedFlag = async (orphanId, isGifted) => {
  const { rows } = await query(
    `UPDATE orphans
     SET is_gifted = $1
     WHERE id = $2
     RETURNING id, full_name, is_gifted, status`,
    [isGifted, orphanId]
  );
  return rows[0] || null;
};

/**
 * Upsert the gifted benefits config for an orphan.
 * Creates a new record if none exists; updates it otherwise.
 *
 * @param {Object} params
 * @returns {Object} upserted gifted_configs row
 */
const upsertGiftedConfig = async ({
  orphanId,
  extraMonthlyAmount,
  schoolName,
  schoolEnrolled,
  uniformIncluded,
  bagIncluded,
  transportIncluded,
  personalAllowance,
  notes,
  createdBy,
}) => {
  const { rows } = await query(
    `INSERT INTO gifted_configs
       (orphan_id, extra_monthly_amount, school_name, school_enrolled,
        uniform_included, bag_included, transport_included,
        personal_allowance, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (orphan_id) DO UPDATE SET
       extra_monthly_amount = EXCLUDED.extra_monthly_amount,
       school_name          = EXCLUDED.school_name,
       school_enrolled      = EXCLUDED.school_enrolled,
       uniform_included     = EXCLUDED.uniform_included,
       bag_included         = EXCLUDED.bag_included,
       transport_included   = EXCLUDED.transport_included,
       personal_allowance   = EXCLUDED.personal_allowance,
       notes                = EXCLUDED.notes,
       updated_at           = NOW()
     RETURNING *`,
    [
      orphanId,
      extraMonthlyAmount ?? 0,
      schoolName ?? null,
      schoolEnrolled ?? false,
      uniformIncluded ?? false,
      bagIncluded ?? false,
      transportIncluded ?? false,
      personalAllowance ?? 0,
      notes ?? null,
      createdBy,
    ]
  );
  return rows[0];
};

/**
 * Get the gifted config for a single orphan.
 * Returns null if no config exists yet.
 *
 * @param {string} orphanId
 * @returns {Object|null}
 */
const getGiftedConfig = async (orphanId) => {
  const { rows } = await query(
    `SELECT gc.*, u.full_name AS created_by_name
     FROM gifted_configs gc
     LEFT JOIN users u ON u.id = gc.created_by
     WHERE gc.orphan_id = $1`,
    [orphanId]
  );
  return rows[0] || null;
};

/**
 * Get all gifted orphans with their configs and sponsorship info.
 * Used by the GM's dedicated gifted-orphan section (FR-057).
 *
 * @returns {Array}
 */
const getAllGiftedOrphans = async () => {
  const { rows } = await query(
    `SELECT
       o.id, o.full_name, o.date_of_birth, o.gender, o.status,
       o.guardian_name, o.is_gifted, o.created_at,
       g.name_ar AS governorate_ar,
       u.full_name AS agent_name,
       sp.monthly_amount AS base_monthly_amount,
       sp.start_date AS sponsorship_start,
       s.full_name AS sponsor_name,
       gc.extra_monthly_amount,
       gc.school_name, gc.school_enrolled,
       gc.uniform_included, gc.bag_included,
       gc.transport_included, gc.personal_allowance,
       gc.notes AS config_notes,
       -- Total monthly value = base + extra + allowance
       COALESCE(sp.monthly_amount, 0)
         + COALESCE(gc.extra_monthly_amount, 0)
         + COALESCE(gc.personal_allowance, 0) AS total_monthly_value
     FROM orphans o
     LEFT JOIN governorates g   ON g.id  = o.governorate_id
     LEFT JOIN users u          ON u.id  = o.agent_id
     LEFT JOIN sponsorships sp  ON sp.beneficiary_id   = o.id
                                AND sp.beneficiary_type = 'orphan'
                                AND sp.is_active        = TRUE
     LEFT JOIN sponsors s       ON s.id  = sp.sponsor_id
     LEFT JOIN gifted_configs gc ON gc.orphan_id = o.id
     WHERE o.is_gifted = TRUE
     ORDER BY o.created_at DESC`
  );
  return rows;
};

module.exports = {
  setGiftedFlag,
  upsertGiftedConfig,
  getGiftedConfig,
  getAllGiftedOrphans,
};
