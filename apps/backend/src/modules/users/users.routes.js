const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');

// GET /api/audit-logs?entityType=orphan&entityId=<uuid>&limit=20
router.get('/', authenticate, authorize('gm'), async (req, res, next) => {
  try {
    const { entityType, entityId, limit = 20, offset = 0 } = req.query;

    const conditions = [];
    const params = [];

    if (entityType) { params.push(entityType); conditions.push(`al.entity_type = $${params.length}`); }
    if (entityId)   { params.push(entityId);   conditions.push(`al.entity_id = $${params.length}`); }

    params.push(Math.min(parseInt(limit), 100));
    params.push(parseInt(offset));

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         al.id, al.action, al.entity_type, al.entity_id,
         al.old_value, al.new_value, al.created_at,
         u.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ logs: rows });
  } catch (err) { next(err); }
});

module.exports = router;