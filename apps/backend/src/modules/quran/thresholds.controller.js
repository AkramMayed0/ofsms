/**
 * thresholds.controller.js — OFSMS Quran Thresholds HTTP Handler Layer
 *
 * Responsible only for HTTP req/res handling.
 * Logic is simple enough that it directly calls the repository.
 */

const repository = require('./quran.repository');

// ── GET /api/quran-thresholds ─────────────────────────────────────────────────
const getThresholds = async (_req, res, next) => {
  try {
    const thresholds = await repository.findAllThresholds();
    return res.json({ thresholds });
  } catch (err) { next(err); }
};

// ── POST /api/quran-thresholds ────────────────────────────────────────────────
const createThreshold = async (req, res, next) => {
  try {
    const { age_min, age_max, min_juz_per_month, label } = req.body;

    if (age_min == null || age_max == null || min_juz_per_month == null) {
      return res.status(422).json({ error: 'age_min, age_max, وmin_juz_per_month مطلوبة' });
    }
    if (parseInt(age_max) <= parseInt(age_min)) {
      return res.status(422).json({ error: 'age_max يجب أن يكون أكبر من age_min' });
    }

    const threshold = await repository.insertThreshold(
      parseInt(age_min),
      parseInt(age_max),
      parseFloat(min_juz_per_month),
      label
    );

    return res.status(201).json({ threshold });
  } catch (err) { next(err); }
};

// ── PUT /api/quran-thresholds/:id ─────────────────────────────────────────────
const updateThreshold = async (req, res, next) => {
  try {
    const { age_min, age_max, min_juz_per_month, label } = req.body;

    const threshold = await repository.updateThreshold(
      req.params.id,
      age_min != null ? parseInt(age_min) : null,
      age_max != null ? parseInt(age_max) : null,
      min_juz_per_month != null ? parseFloat(min_juz_per_month) : null,
      label
    );

    if (!threshold) return res.status(404).json({ error: 'الإعداد غير موجود' });
    return res.json({ threshold });
  } catch (err) { next(err); }
};

module.exports = {
  getThresholds,
  createThreshold,
  updateThreshold,
};
