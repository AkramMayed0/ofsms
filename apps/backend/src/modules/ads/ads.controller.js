/**
 * ads.controller.js — OFSMS Ads HTTP Handler Layer
 *
 * Responsible only for:
 *   - Reading from req (params, body, user/sponsor)
 *   - Calling the service layer
 *   - Writing the HTTP response (status + JSON)
 *
 * No business logic lives here.
 * Errors from the service are caught and mapped to HTTP status codes.
 */

const service = require('./ads.service');

// ── GET / ─────────────────────────────────────────────────────────────────────
const handleGetAds = async (_req, res, next) => {
  try {
    const ads = await service.getAds();
    return res.json({ ads });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

// ── DELETE /:id ───────────────────────────────────────────────────────────────
const handleDeleteAd = async (req, res, next) => {
  try {
    await service.deleteAd(req.params.id);
    return res.json({ message: 'تم حذف الإعلان من صفحة الإعلانات' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

// ── GET /sponsor/feed ─────────────────────────────────────────────────────────
const handleGetSponsorFeed = async (req, res, next) => {
  try {
    const ads = await service.getAdsForSponsor(req.sponsor.id);
    return res.json({ ads });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

module.exports = {
  handleGetAds,
  handleDeleteAd,
  handleGetSponsorFeed,
};
