/**
 * families.routes.js
 * Mounted at: /api/families
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./families.controller');

const router = Router();

// ── Validation rules ──────────────────────────────────────────

const createFamilyRules = [
  body('familyName')
    .trim()
    .notEmpty().withMessage('اسم الأسرة مطلوب')
    .isLength({ min: 3 }).withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('headOfFamily')
    .trim()
    .notEmpty().withMessage('اسم رب الأسرة مطلوب'),
  body('memberCount')
    .isInt({ min: 1 }).withMessage('عدد الأفراد يجب أن يكون 1 على الأقل'),
  body('governorateId')
    .isInt({ min: 1 }).withMessage('المحافظة مطلوبة'),
];

const updateStatusRules = [
  body('status')
    .isIn(['under_marketing', 'under_sponsorship', 'rejected', 'inactive'])
    .withMessage('حالة غير صحيحة'),
  body('notes')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('ملاحظات الرفض مطلوبة'),
];

// ── Routes ────────────────────────────────────────────────────

// GM only: families available for sponsorship
router.get(
  '/marketing',
  authenticate,
  authorize('gm'),
  controller.getFamiliesUnderMarketing
);

// Agent / Supervisor / GM: list families
router.get(
  '/',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getFamilies
);

// Agent: register a new family
router.post(
  '/',
  authenticate,
  authorize('agent'),
  createFamilyRules,
  controller.createFamily
);

// All roles: get single family
router.get(
  '/:id',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getFamilyById
);

// Agent: edit family details (only while under_review)
router.patch(
  '/:id',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.updateFamily
);

// Supervisor / GM: approve or reject
router.patch(
  '/:id/status',
  authenticate,
  authorize('supervisor', 'gm'),
  updateStatusRules,
  controller.updateFamilyStatus
);

module.exports = router;
