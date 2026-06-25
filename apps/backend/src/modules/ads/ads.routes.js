/**
 * ads.routes.js — OFSMS Ads Endpoints
 *
 * GET    /api/ads/              → list all ads (gm only)
 * DELETE /api/ads/:id           → delete an ad (gm only, must be sponsored)
 * GET    /api/ads/sponsor/feed  → ads visible to the authenticated sponsor
 *
 * This file contains ONLY route definitions and middleware wiring.
 * Business logic  → ads.service.js
 * HTTP handling   → ads.controller.js
 * DB queries      → ads.repository.js
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const { authenticateSponsor } = require('../../middleware/sponsorAuth');
const { handleGetAds, handleDeleteAd, handleGetSponsorFeed } = require('./ads.controller');

const router = Router();

// GET /api/ads/
router.get('/', authenticate, authorize('gm'), handleGetAds);

// DELETE /api/ads/:id
router.delete('/:id', authenticate, authorize('gm'), handleDeleteAd);

// GET /api/ads/sponsor/feed
router.get('/sponsor/feed', authenticateSponsor, handleGetSponsorFeed);

module.exports = router;
