const express = require('express');
const router  = express.Router();
const { query } = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/rbac');

/**
 * GET /api/governorates
 * Returns all governorates (id, name_ar, name_en).
 * Accessible by all authenticated roles — used for dropdowns.
 */
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name_ar, name_en FROM governorates ORDER BY id ASC'
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
});

/**
 * GET /api/governorates/:id/orphans
 * Returns all orphans in a specific governorate with full details.
 * GM only — covers SADD FR-042.
 */
router.get('/:id/orphans', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const govId = parseInt(req.params.id, 10);
    if (isNaN(govId)) {
      return res.status(400).json({ error: 'معرّف المحافظة غير صحيح' });
    }

    // Check governorate exists
    const { rows: govRows } = await query(
      'SELECT id, name_ar, name_en FROM governorates WHERE id = $1',
      [govId]
    );
    if (!govRows[0]) {
      return res.status(404).json({ error: 'المحافظة غير موجودة' });
    }

    // Get all orphans in this governorate with sponsor + agent + latest report
    const { rows: orphans } = await query(
      `SELECT
         o.id,
         o.full_name,
         o.date_of_birth,
         o.gender,
         o.status,
         o.is_gifted,
         o.guardian_name,
         o.created_at,
         -- Agent info
         u.full_name          AS agent_name,
         u.id                 AS agent_id,
         -- Active sponsorship
         sp.monthly_amount,
         sp.start_date        AS sponsorship_start,
         s.full_name          AS sponsor_name,
         s.id                 AS sponsor_id,
         -- Latest Quran report status
         qr.status            AS latest_report_status,
         qr.month             AS latest_report_month,
         qr.year              AS latest_report_year,
         qr.juz_memorized     AS latest_juz_memorized
       FROM orphans o
       LEFT JOIN users u
              ON u.id = o.agent_id
       LEFT JOIN sponsorships sp
              ON sp.beneficiary_id   = o.id
             AND sp.beneficiary_type = 'orphan'
             AND sp.is_active        = TRUE
       LEFT JOIN sponsors s
              ON s.id = sp.sponsor_id
       LEFT JOIN LATERAL (
         SELECT status, month, year, juz_memorized
         FROM quran_reports
         WHERE orphan_id = o.id
         ORDER BY year DESC, month DESC
         LIMIT 1
       ) qr ON TRUE
       WHERE o.governorate_id = $1
       ORDER BY o.status ASC, o.created_at DESC`,
      [govId]
    );

    // Summary counts
    const summary = {
      total:              orphans.length,
      under_review:       orphans.filter(o => o.status === 'under_review').length,
      under_marketing:    orphans.filter(o => o.status === 'under_marketing').length,
      under_sponsorship:  orphans.filter(o => o.status === 'under_sponsorship').length,
      rejected:           orphans.filter(o => o.status === 'rejected').length,
      gifted:             orphans.filter(o => o.is_gifted).length,
      total_monthly_value: orphans.reduce((sum, o) =>
        sum + Number(o.monthly_amount || 0), 0
      ),
    };

    return res.json({
      governorate: govRows[0],
      summary,
      orphans,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/governorates/:id/families
 * Returns all families in a specific governorate.
 * GM only.
 */
router.get('/:id/families', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const govId = parseInt(req.params.id, 10);
    if (isNaN(govId)) {
      return res.status(400).json({ error: 'معرّف المحافظة غير صحيح' });
    }

    const { rows: govRows } = await query(
      'SELECT id, name_ar, name_en FROM governorates WHERE id = $1',
      [govId]
    );
    if (!govRows[0]) {
      return res.status(404).json({ error: 'المحافظة غير موجودة' });
    }

    const { rows: families } = await query(
      `SELECT
         f.id,
         f.family_name,
         f.head_of_family,
         f.member_count,
         f.status,
         f.created_at,
         u.full_name       AS agent_name,
         sp.monthly_amount,
         s.full_name       AS sponsor_name
       FROM families f
       LEFT JOIN users u
              ON u.id = f.agent_id
       LEFT JOIN sponsorships sp
              ON sp.beneficiary_id   = f.id
             AND sp.beneficiary_type = 'family'
             AND sp.is_active        = TRUE
       LEFT JOIN sponsors s
              ON s.id = sp.sponsor_id
       WHERE f.governorate_id = $1
       ORDER BY f.status ASC, f.created_at DESC`,
      [govId]
    );

    return res.json({
      governorate: govRows[0],
      total: families.length,
      families,
    });
  } catch (err) { next(err); }
});

module.exports = router;