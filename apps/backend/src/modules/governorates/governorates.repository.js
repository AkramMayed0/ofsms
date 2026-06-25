/**
 * governorates.repository.js
 * Database queries for governorates.
 */

const { query } = require('../../config/db');

/**
 * Retrieve all governorates.
 */
const findAllGovernorates = async () => {
  const { rows } = await query(
    'SELECT id, name_ar, name_en FROM governorates ORDER BY id ASC'
  );
  return rows;
};

/**
 * Retrieve all active/pending orphans in a governorate.
 */
const findOrphansByGovernorateId = async (govId) => {
  const { rows } = await query(
    `SELECT
       o.id,
       o.full_name,
       o.date_of_birth,
       o.gender,
       o.status,
       o.is_gifted,
       o.created_at,
       u.full_name  AS agent_name,
       s.full_name  AS sponsor_name
     FROM orphans o
     LEFT JOIN users u       ON u.id  = o.agent_id
     LEFT JOIN sponsorships sp
       ON sp.beneficiary_id   = o.id
      AND sp.beneficiary_type = 'orphan'
      AND sp.is_active        = TRUE
     LEFT JOIN sponsors s    ON s.id  = sp.sponsor_id
     WHERE o.governorate_id = $1
       AND o.status != 'inactive'
     ORDER BY o.created_at DESC`,
    [govId]
  );
  return rows;
};

module.exports = {
  findAllGovernorates,
  findOrphansByGovernorateId,
};
