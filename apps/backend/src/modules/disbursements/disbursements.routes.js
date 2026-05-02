/**
 * disbursements.routes.js
 * Mounted at: /api/disbursements
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./disbursements.controller');

const router = Router();

// ── GET /api/disbursements — list all disbursement lists
router.get(
  '/',
  authenticate,
  authorize('supervisor', 'finance', 'gm'),
  controller.getDisbursementLists
);

// ── POST /api/disbursements/generate — generate current month list (GM/Supervisor)
router.post(
  '/generate',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.generateDisbursementList
);

// ── GET /api/disbursements/:id — get single list with items
router.get(
  '/:id',
  authenticate,
  authorize('supervisor', 'finance', 'gm'),
  controller.getDisbursementById
);

// ── PATCH /api/disbursements/:id/approve — supervisor approves list
router.patch(
  '/:id/approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorApprove
);

// ── PATCH /api/disbursements/:id/reject — supervisor rejects list
router.patch(
  '/:id/reject',
  authenticate,
  authorize('supervisor', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.supervisorReject
);

// ── PATCH /api/disbursements/:id/finance-approve — finance approves
router.patch(
  '/:id/finance-approve',
  authenticate,
  authorize('finance', 'gm'),
  controller.financeApprove
);

// ── PATCH /api/disbursements/:id/finance-reject — finance rejects
router.patch(
  '/:id/finance-reject',
  authenticate,
  authorize('finance', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.financeReject
);

// ── PATCH /api/disbursements/:id/release — GM releases funds
router.patch(
  '/:id/release',
  authenticate,
  authorize('gm'),
  controller.gmRelease
);

module.exports = router;
