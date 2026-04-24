/**
 * config.routes.js
 * Mounted at: /api/config
 *
 * GET  /api/config/quran-thresholds  → read thresholds (GM + supervisor)
 * PUT  /api/config/quran-thresholds  → update thresholds (GM only)
 */

const { Router } = require('express');
const { body }   = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./quranThresholds.controller');

const router = Router();

// ── Validation ────────────────────────────────────────────────────────────────
const updateThresholdsRules = [
  body('thresholds')
    .isArray({ min: 1 })
    .withMessage('thresholds يجب أن تكون مصفوفة غير فارغة'),

  body('thresholds.*.id')
    .isInt({ min: 1 })
    .withMessage('كل threshold يجب أن يحتوي على id صحيح'),

  body('thresholds.*.min_juz_per_month')
    .isFloat({ min: 0, max: 30 })
    .withMessage('min_juz_per_month يجب أن يكون بين 0 و 30'),

  body('thresholds.*.label')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('label يجب ألا يتجاوز 100 حرف'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GM and supervisor can read thresholds (supervisor needs them to review reports)
router.get(
  '/quran-thresholds',
  authenticate,
  authorize('gm', 'supervisor'),
  controller.getThresholds
);

// Only GM can change thresholds (FR-016, FR-059)
router.put(
  '/quran-thresholds',
  authenticate,
  authorize('gm'),
  updateThresholdsRules,
  controller.updateThresholds
);

module.exports = router;
