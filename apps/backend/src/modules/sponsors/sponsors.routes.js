/**
 * sponsors.routes.js
 * Mounted at: /api/sponsors
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./sponsors.controller');

const router = Router();

// ── Validation rules ──────────────────────────────────────────

const createSponsorRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('اسم الكافل مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('البريد الإلكتروني غير صحيح'),
  body('phone')
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صحيح'),
  body('portalPassword')
    .notEmpty()
    .withMessage('كلمة مرور البوابة مطلوبة')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
];

const createSponsorshipRules = [
  body('beneficiaryType')
    .isIn(['orphan', 'family'])
    .withMessage('نوع المستفيد يجب أن يكون orphan أو family'),
  body('beneficiaryId')
    .isUUID()
    .withMessage('معرّف المستفيد غير صحيح'),
  body('agentId')
    .isUUID()
    .withMessage('معرّف المندوب غير صحيح'),
  body('startDate')
    .isDate()
    .withMessage('تاريخ البداية غير صحيح'),
  body('monthlyAmount')
    .isFloat({ min: 1 })
    .withMessage('المبلغ الشهري يجب أن يكون أكبر من صفر'),
];

const transferSponsorshipRules = [
  body('beneficiaryType').isIn(['orphan', 'family']),
  body('beneficiaryId').isUUID(),
  body('newSponsorId').isUUID().withMessage('معرّف الكافل الجديد غير صحيح'),
  body('agentId').isUUID(),
  body('monthlyAmount').isFloat({ min: 1 }),
];

// ── Routes ────────────────────────────────────────────────────

// GM only: list all sponsors
router.get(
  '/',
  authenticate,
  authorize('gm'),
  controller.getAllSponsors
);

// GM only: create a new sponsor
router.post(
  '/',
  authenticate,
  authorize('gm'),
  createSponsorRules,
  controller.createSponsor
);

// GM only: transfer a beneficiary between sponsors
router.post(
  '/transfer',
  authenticate,
  authorize('gm'),
  transferSponsorshipRules,
  controller.transferSponsorship
);

// GM only: get a single sponsor + their sponsorships
router.get(
  '/:id',
  authenticate,
  authorize('gm'),
  controller.getSponsorById
);

// GM only: assign a beneficiary to a sponsor
router.post(
  '/:id/sponsorships',
  authenticate,
  authorize('gm'),
  createSponsorshipRules,
  controller.createSponsorship
);

module.exports = router;
