/**
 * receipts.controller.js
 * HTTP handlers for the receipts module.
 */

const { validationResult } = require('express-validator');
const service = require('./receipts.service');

/**
 * POST /api/receipts/biometric
 */
const uploadBiometricReceipt = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { itemId, fingerprintBase64, mimeType } = req.body;

    const receipt = await service.uploadBiometricReceipt({
      itemId,
      agentId: req.user.id,
      fingerprintBase64,
      mimeType,
    });

    return res.status(201).json({
      message: 'تم تسجيل بصمة الاستلام بنجاح',
      receipt,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

/**
 * GET /api/receipts
 */
const getReceipts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const listId = req.query.listId || req.query.list_id;
    const agentId = req.query.agentId || req.query.agent_id;
    
    const receipts = await service.getReceipts({ agentId, listId });

    return res.json({ receipts, total: receipts.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/receipts/summary/:listId
 */
const getAgentReceiptSummary = async (req, res, next) => {
  try {
    // Agents see their own summary; supervisors/GM can pass agentId via query
    const agentId = req.user.role === 'agent'
      ? req.user.id
      : (req.query.agentId || req.query.agent_id);

    if (!agentId) {
      return res.status(400).json({ error: 'agentId مطلوب لأدوار المشرف والمدير العام' });
    }

    const summary = await service.getAgentReceiptSummary(agentId, req.params.listId);
    return res.json({ summary });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/receipts/batch-confirm
 */
const batchConfirm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { listId, notes } = req.body;
    const confirmation = await service.batchConfirm(req.user.id, listId, notes);

    return res.status(201).json({
      message: 'تم تأكيد الكشف بنجاح',
      confirmation,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

/**
 * GET /api/receipts/my-batch
 * Fetch the active disbursement batch items for an agent.
 */
const getMyBatch = async (req, res, next) => {
  try {
    const batch = await service.getAgentActiveBatch(req.user.id);
    if (!batch) {
      return res.json({ message: 'لا يوجد كشف صرف فعّال حالياً', items: [] });
    }
    return res.json(batch);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadBiometricReceipt, getReceipts, getAgentReceiptSummary, batchConfirm, getMyBatch };