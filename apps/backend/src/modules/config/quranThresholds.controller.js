/**
 * quranThresholds.controller.js
 * HTTP handlers for the Quran thresholds config module.
 *
 * GET /api/config/quran-thresholds    → all thresholds (GM, supervisor)
 * PUT /api/config/quran-thresholds    → bulk update (GM only)
 */

const { validationResult } = require('express-validator');
const service = require('./quranThresholds.service');

/**
 * GET /api/config/quran-thresholds
 * Returns all thresholds ordered by age_min ASC.
 */
const getThresholds = async (_req, res, next) => {
  try {
    const thresholds = await service.getAllThresholds();
    return res.json({ thresholds });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/config/quran-thresholds
 * GM only — bulk-update min_juz_per_month for each threshold row.
 *
 * Body: { thresholds: [{ id, min_juz_per_month, label? }, ...] }
 *
 * Age ranges (age_min, age_max) are intentionally immutable via API —
 * changing age ranges requires a migration to avoid data inconsistency
 * with existing quran reports.
 */
const updateThresholds = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { thresholds } = req.body;

    const updated = await service.bulkUpdateThresholds(thresholds, req.user.id);

    return res.json({
      message:    'تم تحديث حصص الحفظ بنجاح',
      thresholds: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getThresholds, updateThresholds };
