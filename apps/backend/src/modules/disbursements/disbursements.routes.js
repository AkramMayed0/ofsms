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

module.exports = router;