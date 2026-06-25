const express = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./governorates.controller');
const validators = require('./governorates.validators');

const router = express.Router();

/**
 * GET /api/governorates
 * Returns all governorates (id, name_ar, name_en).
 * Accessible by all authenticated roles.
 * Used to populate dropdowns in registration forms.
 */
router.get(
  '/',
  authenticate,
  controller.getAllGovernorates
);

/**
 * GET /api/governorates/:id/orphans
 * Returns all orphans registered in a specific governorate.
 * GM only — used for the governorate drill-down analytics page.
 */
router.get(
  '/:id/orphans',
  authenticate,
  authorize('gm'),
  validators.getOrphansByGovernorateRules,
  controller.getOrphansByGovernorateId
);

module.exports = router;
