/**
 * governorates.service.js
 * Business logic for the governorates module.
 */

const repo = require('./governorates.repository');

/**
 * Retrieve all governorates.
 */
const getAllGovernorates = async () => {
  return await repo.findAllGovernorates();
};

/**
 * Retrieve all active/pending orphans in a governorate.
 */
const getOrphansByGovernorateId = async (govId) => {
  return await repo.findOrphansByGovernorateId(govId);
};

module.exports = {
  getAllGovernorates,
  getOrphansByGovernorateId,
};
