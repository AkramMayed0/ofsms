/**
 * disbursements.controller.js
 * HTTP handlers for the disbursements module.
 */

const service = require('./disbursements.service');

/**
 * POST /api/disbursements/generate
 * Creates a DisbursementList for the current month + auto-fills items.
 * GM and Supervisor only.
 */
const generateDisbursementList = async (req, res, next) => {
  try {
    const { list, items } = await service.generateDisbursementList(req.user.id);

    return res.status(201).json({
      message: `تم توليد كشف الصرف لشهر ${list.month}/${list.year} بنجاح`,
      list,
      items,
      total_items:  items.length,
      total_amount: items.reduce((sum, i) => sum + parseFloat(i.amount), 0),
    });
  } catch (err) {
    // Unique constraint violation = list already exists for this month
    if (err.code === '23505') {
      return res.status(409).json({
        error: `كشف الصرف لهذا الشهر موجود بالفعل. لا يمكن توليد كشفين لنفس الشهر`,
      });
    }
    next(err);
  }
};

/**
 * GET /api/disbursements
 * List all disbursement lists.
 */
const getAllDisbursementLists = async (_req, res, next) => {
  try {
    const lists = await service.getAllDisbursementLists();
    return res.json({ lists });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/disbursements/:id
 * Get a single disbursement list with all its items.
 */
const getDisbursementListById = async (req, res, next) => {
  try {
    const result = await service.getDisbursementListById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'كشف الصرف غير موجود' });
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// ADD to apps/backend/src/modules/disbursements/disbursements.controller.js

/**
 * PATCH /api/disbursements/:id/supervisor-approve
 * Supervisor approves → status: supervisor_approved → Finance queue.
 */
const supervisorApproveDisbursement = async (req, res, next) => {
  try {
    const list = await service.supervisorApproveDisbursement(req.params.id, req.user.id);

    if (!list) {
      return res.status(404).json({
        error: 'كشف الصرف غير موجود أو لا يمكن اعتماده في وضعه الحالي (يجب أن يكون في وضع مسودة)',
      });
    }

    return res.json({
      message: `تم اعتماد كشف الصرف لشهر ${list.month}/${list.year} وإرساله للقسم المالي`,
      list,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/disbursements/:id/supervisor-reject
 * Supervisor rejects → status: rejected, notes required.
 */
const supervisorRejectDisbursement = async (req, res, next) => {
  try {
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(422).json({ error: 'ملاحظات الرفض مطلوبة' });
    }

    const list = await service.supervisorRejectDisbursement(req.params.id, req.user.id, notes.trim());

    if (!list) {
      return res.status(404).json({
        error: 'كشف الصرف غير موجود أو لا يمكن رفضه في وضعه الحالي (يجب أن يكون في وضع مسودة)',
      });
    }

    return res.json({
      message: `تم رفض كشف الصرف لشهر ${list.month}/${list.year}`,
      list,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateDisbursementList,
  getAllDisbursementLists,
  getDisbursementListById,
  supervisorApproveDisbursement,   
  supervisorRejectDisbursement,    
};