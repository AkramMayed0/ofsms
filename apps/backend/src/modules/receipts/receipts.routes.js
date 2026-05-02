/**
 * receipts.routes.js
 * Mounted at: /api/receipts
 *
 * POST /api/receipts/biometric          → agent uploads a fingerprint receipt
 * GET  /api/receipts                    → supervisor/GM view all receipts (filterable)
 * GET  /api/receipts/summary/:listId    → agent checks their completion for a list
 */

const { Router } = require('express');
const { body, query: qv } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./receipts.controller');

const router = Router();

// ── POST /api/receipts/biometric ──────────────────────────────────────────────
// Agent uploads a biometric fingerprint for one disbursement item
router.post(
  '/biometric',
  authenticate,
  authorize('agent', 'gm'),
  [
    body('itemId')
      .isUUID()
      .withMessage('معرّف بند الصرف غير صحيح'),
    body('fingerprintBase64')
      .notEmpty()
      .withMessage('بيانات البصمة مطلوبة')
      .isBase64()
      .withMessage('صيغة البصمة غير صحيحة — يجب أن تكون Base64'),
    body('mimeType')
      .optional()
      .isIn(['image/png', 'image/jpeg'])
      .withMessage('نوع الملف يجب أن يكون image/png أو image/jpeg'),
  ],
  controller.uploadBiometricReceipt
);

// ── GET /api/receipts ─────────────────────────────────────────────────────────
// Supervisor / GM: list all receipts, optionally filtered
router.get(
  '/',
  authenticate,
  authorize('supervisor', 'gm'),
  [
    qv('agentId').optional().isUUID().withMessage('agentId غير صحيح'),
    qv('listId').optional().isUUID().withMessage('listId غير صحيح'),
  ],
  controller.getReceipts
);

// ── GET /api/receipts/summary/:listId ─────────────────────────────────────────
// Agent: check how many receipts they've completed for a given disbursement list
router.get(
  '/summary/:listId',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getAgentReceiptSummary
);

// ── POST /api/receipts/batch-confirm ──────────────────────────────────────────
// Agent: confirms that all orphans in their batch have been paid for a list
router.post(
  '/batch-confirm',
  authenticate,
  authorize('agent', 'gm'),
  [
    body('listId')
      .isUUID()
      .withMessage('معرّف كشف الصرف غير صحيح'),
    body('notes')
      .optional()
      .trim(),
  ],
  controller.batchConfirm
);

module.exports = router;