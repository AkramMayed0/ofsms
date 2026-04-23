/**
 * gifted.controller.js
 * HTTP handlers for gifted orphan management.
 *
 * PATCH /api/orphans/:id/gifted      → toggle gifted flag (GM only)
 * PUT   /api/orphans/:id/gifted/config → upsert benefits config (GM only)
 * GET   /api/orphans/:id/gifted/config → get config for one orphan
 * GET   /api/orphans/gifted           → list all gifted orphans (GM only)
 */

const { validationResult } = require('express-validator');
const service = require('./gifted.service');
const orphansService = require('../orphans/orphans.service');

/**
 * PATCH /api/orphans/:id/gifted
 * Toggle is_gifted flag on an orphan.
 * Body: { is_gifted: true | false }
 */
const setGiftedFlag = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const orphan = await orphansService.getOrphanById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    const isGifted = req.body.is_gifted === true || req.body.is_gifted === 'true';
    const updated = await service.setGiftedFlag(req.params.id, isGifted);

    return res.json({
      message: isGifted
        ? 'تم تصنيف اليتيم كموهوب بنجاح'
        : 'تم إلغاء تصنيف اليتيم كموهوب',
      orphan: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/orphans/:id/gifted/config
 * Create or update the benefits config for a gifted orphan.
 * Automatically sets is_gifted = true if not already set.
 */
const upsertGiftedConfig = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const orphan = await orphansService.getOrphanById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    // Auto-flag as gifted when a config is saved
    if (!orphan.is_gifted) {
      await service.setGiftedFlag(req.params.id, true);
    }

    const {
      extraMonthlyAmount,
      schoolName,
      schoolEnrolled,
      uniformIncluded,
      bagIncluded,
      transportIncluded,
      personalAllowance,
      notes,
    } = req.body;

    const config = await service.upsertGiftedConfig({
      orphanId: req.params.id,
      extraMonthlyAmount,
      schoolName,
      schoolEnrolled,
      uniformIncluded,
      bagIncluded,
      transportIncluded,
      personalAllowance,
      notes,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      message: 'تم حفظ إعدادات كفالة اليتيم الموهوب بنجاح',
      config,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orphans/:id/gifted/config
 * Fetch the benefits config for a single gifted orphan.
 * GM and supervisor can read; agents cannot.
 */
const getGiftedConfig = async (req, res, next) => {
  try {
    const orphan = await orphansService.getOrphanById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    if (!orphan.is_gifted) {
      return res.status(400).json({ error: 'هذا اليتيم غير مصنّف كموهوب' });
    }

    const config = await service.getGiftedConfig(req.params.id);
    return res.json({ config: config || null });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orphans/gifted
 * List all gifted orphans with configs and sponsorship totals.
 * GM only.
 */
const getAllGiftedOrphans = async (_req, res, next) => {
  try {
    const orphans = await service.getAllGiftedOrphans();
    return res.json({ orphans, total: orphans.length });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  setGiftedFlag,
  upsertGiftedConfig,
  getGiftedConfig,
  getAllGiftedOrphans,
};
