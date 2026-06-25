/**
 * thresholds.routes.js
 * Mounted at: /api/quran-thresholds
 *
 * This file contains ONLY route definitions and middleware wiring.
 * DB queries -> quran.repository.js
 * HTTP handling -> thresholds.controller.js
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./thresholds.controller');

const router = Router();

// GET /api/quran-thresholds — all roles can read (used during report review)
router.get('/', authenticate, controller.getThresholds);

// POST /api/quran-thresholds — GM only, create a new threshold
router.post('/', authenticate, authorize('gm'), controller.createThreshold);

// PUT /api/quran-thresholds/:id — GM only, update a threshold
router.put('/:id', authenticate, authorize('gm'), controller.updateThreshold);

module.exports = router;