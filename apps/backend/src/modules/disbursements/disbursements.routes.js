// apps/backend/src/modules/disbursements/disbursements.routes.js

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./disbursements.controller');

const router = Router();

// GET /api/disbursements
router.get(
  '/',
  authenticate,
  authorize('supervisor', 'finance', 'gm'),
  controller.getDisbursementLists
);

// POST /api/disbursements/generate
router.post(
  '/generate',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.generateDisbursementList
);

// GET /api/disbursements/:id
router.get(
  '/:id',
  authenticate,
  authorize('supervisor', 'finance', 'gm'),
  controller.getDisbursementById
);

// PATCH /api/disbursements/:id/approve (original)
router.patch(
  '/:id/approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorApprove
);

// PATCH /api/disbursements/:id/supervisor-approve (alias used by frontend)
router.patch(
  '/:id/supervisor-approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorApprove
);

// PATCH /api/disbursements/:id/reject (original)
router.patch(
  '/:id/reject',
  authenticate,
  authorize('supervisor', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.supervisorReject
);

// PATCH /api/disbursements/:id/supervisor-reject (alias used by frontend)
router.patch(
  '/:id/supervisor-reject',
  authenticate,
  authorize('supervisor', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.supervisorReject
);

// PATCH /api/disbursements/:id/finance-approve
router.patch(
  '/:id/finance-approve',
  authenticate,
  authorize('finance', 'gm'),
  controller.financeApprove
);

// PATCH /api/disbursements/:id/finance-reject
router.patch(
  '/:id/finance-reject',
  authenticate,
  authorize('finance', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.financeReject
);

// PATCH /api/disbursements/:id/release
router.patch(
  '/:id/release',
  authenticate,
  authorize('gm'),
  controller.gmRelease
);

// PATCH /api/disbursements/:id/gm-release (alias used by frontend)
router.patch(
  '/:id/gm-release',
  authenticate,
  authorize('gm'),
  controller.gmRelease
);

module.exports = router;