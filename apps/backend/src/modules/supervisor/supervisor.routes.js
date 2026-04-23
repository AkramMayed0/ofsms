/**
 * supervisor.routes.js
 * Mounted at: /api/supervisor
 *
 * GET /api/supervisor/queue
 *   Returns all orphans AND families with status = under_review, merged and
 *   sorted by created_at ASC (oldest first — FIFO review order).
 *   Accessible by: supervisor, gm
 *
 * Each item has a `record_type` field ('orphan' | 'family') so the frontend
 * knows which detail page to link to and which PATCH endpoint to call.
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');

const router = Router();

// ── GET /api/supervisor/queue ─────────────────────────────────────────────────
router.get(
  '/queue',
  authenticate,
  authorize('supervisor', 'gm'),
  async (_req, res, next) => {
    try {
      // Orphans under review
      const { rows: orphans } = await query(`
        SELECT
          o.id,
          o.full_name          AS name,
          'orphan'             AS record_type,
          o.status,
          o.guardian_name,
          o.notes,
          o.created_at,
          g.name_ar            AS governorate_ar,
          u.full_name          AS agent_name,
          u.id                 AS agent_id
        FROM orphans o
        LEFT JOIN governorates g ON g.id = o.governorate_id
        LEFT JOIN users u        ON u.id = o.agent_id
        WHERE o.status = 'under_review'
        ORDER BY o.created_at ASC
      `);

      // Families under review
      const { rows: families } = await query(`
        SELECT
          f.id,
          f.family_name        AS name,
          'family'             AS record_type,
          f.status,
          f.head_of_family     AS guardian_name,
          f.notes,
          f.created_at,
          g.name_ar            AS governorate_ar,
          u.full_name          AS agent_name,
          u.id                 AS agent_id
        FROM families f
        LEFT JOIN governorates g ON g.id = f.governorate_id
        LEFT JOIN users u        ON u.id = f.agent_id
        WHERE f.status = 'under_review'
        ORDER BY f.created_at ASC
      `);

      // Merge and sort by created_at ascending (oldest first)
      const queue = [...orphans, ...families].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      return res.json({
        queue,
        total: queue.length,
        orphan_count: orphans.length,
        family_count: families.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
