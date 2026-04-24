const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');

const router = Router();

// GET /api/quran-thresholds — all roles can read (used during report review)
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM quran_thresholds ORDER BY age_min ASC'
    );
    res.json({ thresholds: rows });
  } catch (err) { next(err); }
});

// PUT /api/quran-thresholds/:id — GM only, update a threshold
router.put('/:id', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const { age_min, age_max, min_juz_per_month, label } = req.body;
    const { rows } = await query(
      `UPDATE quran_thresholds
       SET age_min = COALESCE($1, age_min),
           age_max = COALESCE($2, age_max),
           min_juz_per_month = COALESCE($3, min_juz_per_month),
           label = COALESCE($4, label)
       WHERE id = $5
       RETURNING *`,
      [age_min, age_max, min_juz_per_month, label, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الإعداد غير موجود' });
    res.json({ threshold: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;