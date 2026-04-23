/**
 * gifted.routes.js
 * Mounted inside orphans router — prefix is /api/orphans
 *
 * Routes added:
 *   GET   /api/orphans/gifted              → all gifted orphans (GM)
 *   PATCH /api/orphans/:id/gifted          → toggle gifted flag (GM)
 *   PUT   /api/orphans/:id/gifted/config   → upsert benefits config (GM)
 *   GET   /api/orphans/:id/gifted/config   → read config (GM, supervisor)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./gifted.controller');

const router = Router();

// ── Validation rules ──────────────────────────────────────────────────────────

const setGiftedFlagRules = [
  body('is_gifted')
    .notEmpty()
    .withMessage('حقل is_gifted مطلوب')
    .isBoolean()
    .withMessage('is_gifted يجب أن يكون true أو false'),
];

const upsertConfigRules = [
  body('extraMonthlyAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('المبلغ الإضافي الشهري يجب أن يكون صفرًا أو أكثر'),

  body('schoolName')
    .optional({ nullable: true })
    .isString()
    .trim(),

  body('schoolEnrolled')
    .optional()
    .isBoolean()
    .withMessage('schoolEnrolled يجب أن يكون true أو false'),

  body('uniformIncluded')
    .optional()
    .isBoolean()
    .withMessage('uniformIncluded يجب أن يكون true أو false'),

  body('bagIncluded')
    .optional()
    .isBoolean()
    .withMessage('bagIncluded يجب أن يكون true أو false'),

  body('transportIncluded')
    .optional()
    .isBoolean()
    .withMessage('transportIncluded يجب أن يكون true أو false'),

  body('personalAllowance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('المصروف الشخصي يجب أن يكون صفرًا أو أكثر'),

  body('notes')
    .optional({ nullable: true })
    .isString()
    .trim(),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// IMPORTANT: /gifted must come before /:id routes to avoid param capture
router.get(
  '/gifted',
  authenticate,
  authorize('gm'),
  controller.getAllGiftedOrphans
);

router.patch(
  '/:id/gifted',
  authenticate,
  authorize('gm'),
  setGiftedFlagRules,
  controller.setGiftedFlag
);

router.put(
  '/:id/gifted/config',
  authenticate,
  authorize('gm'),
  upsertConfigRules,
  controller.upsertGiftedConfig
);

router.get(
  '/:id/gifted/config',
  authenticate,
  authorize('gm', 'supervisor'),
  controller.getGiftedConfig
);

module.exports = router;
