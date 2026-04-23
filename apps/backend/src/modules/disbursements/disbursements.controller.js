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

module.exports = {
  generateDisbursementList,
  getAllDisbursementLists,
  getDisbursementListById,
};