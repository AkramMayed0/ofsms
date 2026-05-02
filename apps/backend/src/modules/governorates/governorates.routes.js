const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/rbac');

/**
 * GET /api/governorates
 * Returns all governorates (id, name_ar, name_en).
 * Accessible by all authenticated roles.
 * Used to populate dropdowns in registration forms.
 */
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name_ar, name_en FROM governorates ORDER BY id ASC'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/governorates/:id/orphans
 * Returns all orphans registered in a specific governorate.
 * GM only — used for the governorate drill-down analytics page.
 *
 * Response: { orphans: [...], total: n }
 * Each orphan includes: id, full_name, date_of_birth, gender, status,
 *   is_gifted, agent_name, sponsor_name, created_at
 */
router.get('/:id/orphans', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         o.id,
         o.full_name,
         o.date_of_birth,
         o.gender,
         o.status,
         o.is_gifted,
         o.created_at,
         u.full_name  AS agent_name,
         s.full_name  AS sponsor_name
       FROM orphans o
       LEFT JOIN users u       ON u.id  = o.agent_id
       LEFT JOIN sponsorships sp
         ON sp.beneficiary_id   = o.id
        AND sp.beneficiary_type = 'orphan'
        AND sp.is_active        = TRUE
       LEFT JOIN sponsors s    ON s.id  = sp.sponsor_id
       WHERE o.governorate_id = $1
         AND o.status != 'inactive'
       ORDER BY o.created_at DESC`,
      [req.params.id]
    );

    res.json({ orphans: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
