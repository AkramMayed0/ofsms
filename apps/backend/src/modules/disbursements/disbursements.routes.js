/**
 * disbursements.routes.js
 * Mounted at: /api/disbursements
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./disbursements.controller');

const router = Router();

// GM + Supervisor: generate this month's disbursement list
router.post(
  '/generate',
  authenticate,
  authorize('gm', 'supervisor'),
  controller.generateDisbursementList
);

// GM + Supervisor + Finance: list all disbursement lists
router.get(
  '/',
  authenticate,
  authorize('gm', 'supervisor', 'finance'),
  controller.getAllDisbursementLists
);

// GM + Supervisor + Finance: get a single list with items
router.get(
  '/:id',
  authenticate,
  authorize('gm', 'supervisor', 'finance'),
  controller.getDisbursementListById
);

// Supervisor + GM: approve a disbursement list (draft → supervisor_approved)
router.patch(
  '/:id/supervisor-approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorApproveDisbursement
);

// Supervisor + GM: reject a disbursement list (draft → rejected)
router.patch(
  '/:id/supervisor-reject',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorRejectDisbursement
);

// Finance + GM: approve (supervisor_approved → finance_approved)
router.patch(
  '/:id/finance-approve',
  authenticate,
  authorize('finance', 'gm'),
  controller.financeApproveDisbursement
);

// Finance + GM: reject (supervisor_approved → rejected), notes required
router.patch(
  '/:id/finance-reject',
  authenticate,
  authorize('finance', 'gm'),
  controller.financeRejectDisbursement
);

module.exports = router;