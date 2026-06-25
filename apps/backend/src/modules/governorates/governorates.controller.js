/**
 * governorates.controller.js
 * Handles HTTP requests for the governorates module.
 */

const service = require('./governorates.service');

/**
 * GET /api/governorates
 * Retrieve all governorates.
 */
const getAllGovernorates = async (req, res, next) => {
  try {
    const governorates = await service.getAllGovernorates();
    return res.json({ data: governorates });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/governorates/:id/orphans
 * Retrieve active/pending orphans in a governorate.
 */
const getOrphansByGovernorateId = async (req, res, next) => {
  try {
    const orphans = await service.getOrphansByGovernorateId(parseInt(req.params.id, 10));
    return res.json({
      orphans,
      total: orphans.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllGovernorates,
  getOrphansByGovernorateId,
};
