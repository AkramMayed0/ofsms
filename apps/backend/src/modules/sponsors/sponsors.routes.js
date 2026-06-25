/**
 * sponsors.routes.js
 * Mounted at: /api/sponsors
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./sponsors.controller');
const validators = require('./sponsors.validators');

const router = Router();

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
  validators.createSponsorRules,
  controller.createSponsor
);

// GM only: update an existing sponsor
router.put(
  '/:id',
  authenticate,
  authorize('gm'),
  validators.updateSponsorRules,
  controller.updateSponsor
);

// GM only: delete a sponsor
router.delete(
  '/:id',
  authenticate,
  authorize('gm'),
  controller.deleteSponsor
);

// GM only: transfer a beneficiary between sponsors
router.post(
  '/transfer',
  authenticate,
  authorize('gm'),
  validators.transferSponsorshipRules,
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
  validators.createSponsorshipRules,
  controller.createSponsorship
);

// GM only: get sponsor portfolio details
router.get(
  '/:id/portfolio',
  authenticate,
  authorize('gm'),
  controller.getSponsorPortfolio
);

module.exports = router;
