/**
 * evaluations.service.js
 * Business logic and database queries for Periodic Evaluations (تقييم الباحث الدوري).
 */

const { query } = require('../../config/db');

/**
 * Calculate overall percentage score from criteria array.
 * Formula: (sum of scores) / (total criteria * 5) * 100
 */
function calculateOverallScore(criteriaScores) {
  if (!Array.isArray(criteriaScores) || criteriaScores.length === 0) {
    return 0;
  }
  let totalScore = 0;
  let totalMax = 0;
  for (const c of criteriaScores) {
    const s = parseFloat(c.score || 0);
    const m = parseFloat(c.max_score || 5);
    totalScore += s;
    totalMax += m;
  }
  if (totalMax <= 0) return 0;
  return Math.round((totalScore / totalMax) * 100);
}

/**
 * Get beneficiary list (orphans or families) with evaluation count and last score.
 */
async function getBeneficiariesList(type = 'orphan', search = '') {
  const searchTerm = search.trim() ? `%${search.trim()}%` : null;

  if (type === 'family') {
    const { rows } = await query(
      `SELECT 
        f.id, 
        f.family_name AS name,
        'family' AS type,
        f.head_of_family,
        f.member_count,
        f.status,
        g.name_ar AS governorate_name,
        COUNT(pe.id)::int AS evaluations_count,
        MAX(pe.evaluation_date) AS last_evaluation_date,
        (
          SELECT overall_score 
          FROM periodic_evaluations 
          WHERE beneficiary_type = 'family' AND beneficiary_id = f.id 
          ORDER BY evaluation_date DESC, created_at DESC 
          LIMIT 1
        ) AS latest_score
      FROM families f
      LEFT JOIN governorates g ON g.id = f.governorate_id
      LEFT JOIN periodic_evaluations pe ON pe.beneficiary_type = 'family' AND pe.beneficiary_id = f.id
      WHERE ($1::text IS NULL OR f.family_name ILIKE $1 OR f.head_of_family ILIKE $1)
      GROUP BY f.id, f.family_name, f.head_of_family, f.member_count, f.status, g.name_ar
      ORDER BY last_evaluation_date DESC NULLS LAST, f.family_name ASC
      LIMIT 100`,
      [searchTerm]
    );
    return rows;
  }

  // Default: orphan
  const { rows } = await query(
    `SELECT 
      o.id, 
      o.full_name AS name,
      'orphan' AS type,
      o.status,
      o.date_of_birth,
      o.gender,
      o.guardian_name,
      g.name_ar AS governorate_name,
      COUNT(pe.id)::int AS evaluations_count,
      MAX(pe.evaluation_date) AS last_evaluation_date,
      (
        SELECT overall_score 
        FROM periodic_evaluations 
        WHERE beneficiary_type = 'orphan' AND beneficiary_id = o.id 
        ORDER BY evaluation_date DESC, created_at DESC 
        LIMIT 1
      ) AS latest_score
    FROM orphans o
    LEFT JOIN governorates g ON g.id = o.governorate_id
    LEFT JOIN periodic_evaluations pe ON pe.beneficiary_type = 'orphan' AND pe.beneficiary_id = o.id
    WHERE ($1::text IS NULL OR o.full_name ILIKE $1)
    GROUP BY o.id, o.full_name, o.status, o.date_of_birth, o.gender, o.guardian_name, g.name_ar
    ORDER BY last_evaluation_date DESC NULLS LAST, o.full_name ASC
    LIMIT 100`,
    [searchTerm]
  );
  return rows;
}

/**
 * Get all evaluations for a beneficiary.
 */
async function getEvaluationsByBeneficiary(beneficiaryType, beneficiaryId) {
  const { rows } = await query(
    `SELECT 
      pe.*,
      u.full_name AS researcher_name
    FROM periodic_evaluations pe
    LEFT JOIN users u ON u.id = pe.researcher_id
    WHERE pe.beneficiary_type = $1 AND pe.beneficiary_id = $2
    ORDER BY pe.evaluation_date DESC, pe.created_at DESC`,
    [beneficiaryType, beneficiaryId]
  );
  return rows;
}

/**
 * Get single evaluation by ID.
 */
async function getEvaluationById(id) {
  const { rows } = await query(
    `SELECT 
      pe.*,
      u.full_name AS researcher_name
    FROM periodic_evaluations pe
    LEFT JOIN users u ON u.id = pe.researcher_id
    WHERE pe.id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new periodic evaluation.
 */
async function createEvaluation({
  beneficiaryType,
  beneficiaryId,
  evaluationDate,
  periodName,
  showInSponsorPortal,
  criteriaScores,
  generalSummary,
  recommendations,
  researcherId
}) {
  const overallScore = calculateOverallScore(criteriaScores);
  const criteriaJson = JSON.stringify(criteriaScores || []);

  const { rows } = await query(
    `INSERT INTO periodic_evaluations (
      beneficiary_type,
      beneficiary_id,
      evaluation_date,
      period_name,
      show_in_sponsor_portal,
      overall_score,
      criteria_scores,
      general_summary,
      recommendations,
      researcher_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    RETURNING *`,
    [
      beneficiaryType,
      beneficiaryId,
      evaluationDate || new Date(),
      periodName || null,
      showInSponsorPortal !== false,
      overallScore,
      criteriaJson,
      generalSummary || null,
      recommendations || null,
      researcherId || null
    ]
  );
  return rows[0];
}

/**
 * Update existing evaluation.
 */
async function updateEvaluation(id, {
  evaluationDate,
  periodName,
  showInSponsorPortal,
  criteriaScores,
  generalSummary,
  recommendations
}) {
  const overallScore = calculateOverallScore(criteriaScores);
  const criteriaJson = JSON.stringify(criteriaScores || []);

  const { rows } = await query(
    `UPDATE periodic_evaluations
     SET 
       evaluation_date = COALESCE($1, evaluation_date),
       period_name = $2,
       show_in_sponsor_portal = COALESCE($3, show_in_sponsor_portal),
       overall_score = $4,
       criteria_scores = $5::jsonb,
       general_summary = $6,
       recommendations = $7,
       updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      evaluationDate || null,
      periodName || null,
      showInSponsorPortal !== undefined ? showInSponsorPortal : null,
      overallScore,
      criteriaJson,
      generalSummary || null,
      recommendations || null,
      id
    ]
  );
  return rows[0] || null;
}

/**
 * Delete evaluation by ID.
 */
async function deleteEvaluation(id) {
  const { rows } = await query(
    `DELETE FROM periodic_evaluations WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  calculateOverallScore,
  getBeneficiariesList,
  getEvaluationsByBeneficiary,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
};
