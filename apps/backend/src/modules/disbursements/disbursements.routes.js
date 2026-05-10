/**
 * disbursements.routes.js
 * Mounted at: /api/disbursements
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');
const controller = require('./disbursements.controller');

const router = Router();

// ── GET /api/disbursements/agent/released ─────────────────────────────────────
// Agent only: released lists where this agent has beneficiaries
// MUST be defined BEFORE /:id to avoid param capture
router.get(
  '/agent/released',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  async (req, res, next) => {
    try {
      const agentId = req.user.role === 'agent' ? req.user.id : req.query.agentId;

      if (!agentId) {
        return res.status(400).json({ error: 'agentId مطلوب' });
      }

      const { rows } = await query(
        `SELECT DISTINCT
           dl.id,
           dl.month,
           dl.year,
           dl.status,
           dl.gm_approved_at                                          AS released_at,
           COUNT(di.id) FILTER (WHERE di.included = TRUE)            AS total_items,
           COUNT(br.id)                                               AS confirmed_items,
           COUNT(di.id) FILTER (WHERE di.included = TRUE)
             - COUNT(br.id)                                           AS pending_items
         FROM disbursement_lists dl
         JOIN disbursement_items di ON di.list_id = dl.id
         LEFT JOIN orphans  o ON o.id  = di.orphan_id
         LEFT JOIN families f ON f.id  = di.family_id
         LEFT JOIN biometric_receipts br ON br.item_id = di.id
         WHERE dl.status = 'released'
           AND di.included = TRUE
           AND (o.agent_id = $1 OR f.agent_id = $1)
         GROUP BY dl.id
         ORDER BY dl.year DESC, dl.month DESC`,
        [agentId]
      );

      return res.json({ lists: rows });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/disbursements — list all (supervisor / finance / gm only) ─────────
router.get(
  '/',
  authenticate,
  authorize('supervisor', 'finance', 'gm'),
  controller.getDisbursementLists
);

// ── POST /api/disbursements/generate ─────────────────────────────────────────
router.post(
  '/generate',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.generateDisbursementList
);

// ── GET /api/disbursements/:id ────────────────────────────────────────────────
// Agents can also view a specific list (needed for the batch receipts page)
router.get(
  '/:id',
  authenticate,
  authorize('supervisor', 'finance', 'gm', 'agent'),
  controller.getDisbursementById
);

// ── PATCH /api/disbursements/:id/approve — supervisor approves ────────────────
router.patch(
  '/:id/approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.supervisorApprove
);

// ── PATCH /api/disbursements/:id/reject — supervisor rejects ──────────────────
router.patch(
  '/:id/reject',
  authenticate,
  authorize('supervisor', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.supervisorReject
);

// ── PATCH /api/disbursements/:id/finance-approve ──────────────────────────────
router.patch(
  '/:id/finance-approve',
  authenticate,
  authorize('finance', 'gm'),
  controller.financeApprove
);

// ── PATCH /api/disbursements/:id/finance-reject ───────────────────────────────
router.patch(
  '/:id/finance-reject',
  authenticate,
  authorize('finance', 'gm'),
  [body('notes').notEmpty().withMessage('ملاحظات الرفض مطلوبة')],
  controller.financeReject
);

// ── PATCH /api/disbursements/:id/release — GM releases funds ──────────────────
router.patch(
  '/:id/release',
  authenticate,
  authorize('gm'),
  controller.gmRelease
);

module.exports = router;