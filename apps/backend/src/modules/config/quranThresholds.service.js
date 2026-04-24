/**
 * quranThresholds.service.js
 * DB queries for the Quran memorization thresholds config module.
 *
 * Public exports:
 *   getAllThresholds()              → all rows ordered by age_min
 *   bulkUpdateThresholds(rows, userId) → replace all threshold values atomically
 *   getThresholdForAge(ageYears)   → single threshold row matching the orphan's age
 *                                    (used internally by quran report submission)
 */

const { query } = require('../../config/db');

/**
 * Get all thresholds ordered youngest → oldest.
 */
const getAllThresholds = async () => {
  const { rows } = await query(
    `SELECT id, age_min, age_max, min_juz_per_month, label, updated_at
     FROM quran_thresholds
     ORDER BY age_min ASC`
  );
  return rows;
};

/**
 * Bulk-update threshold values.
 * Accepts an array of { id, min_juz_per_month, label } objects.
 * Runs inside a transaction — all succeed or none do.
 * Only updates min_juz_per_month and label; age ranges are immutable via API.
 *
 * @param {{ id: number, min_juz_per_month: number, label?: string }[]} rows
 * @param {string} userId - GM's user ID for audit
 */
const bulkUpdateThresholds = async (rows, userId) => {
  await query('BEGIN');
  try {
    for (const row of rows) {
      await query(
        `UPDATE quran_thresholds
         SET min_juz_per_month = $1,
             label             = COALESCE($2, label),
             updated_by        = $3,
             updated_at        = NOW()
         WHERE id = $4`,
        [row.min_juz_per_month, row.label || null, userId, row.id]
      );
    }
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }

  // Return the updated rows
  return getAllThresholds();
};

/**
 * Look up the threshold that applies to an orphan of a given age.
 * Used internally when validating a Quran report submission.
 *
 * @param {number} ageYears - orphan's age in full years
 * @returns {Object|null} threshold row, or null if no range covers this age
 */
const getThresholdForAge = async (ageYears) => {
  const { rows } = await query(
    `SELECT id, age_min, age_max, min_juz_per_month, label
     FROM quran_thresholds
     WHERE age_min <= $1 AND age_max >= $1
     LIMIT 1`,
    [ageYears]
  );
  return rows[0] || null;
};

module.exports = {
  getAllThresholds,
  bulkUpdateThresholds,
  getThresholdForAge,
};
