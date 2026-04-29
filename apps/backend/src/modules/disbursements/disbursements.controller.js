/**
 * disbursements.controller.js
 */

const { validationResult } = require('express-validator');
const service = require('./disbursements.service');

const getDisbursementLists = async (_req, res, next) => {
  try {
    return res.json({ lists: await service.getDisbursementLists() });
  } catch (err) { next(err); }
};

const getDisbursementById = async (req, res, next) => {
  try {
    const data = await service.getDisbursementById(req.params.id);
    if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });
    return res.json(data);
  } catch (err) { next(err); }
};

const generateDisbursementList = async (req, res, next) => {
  try {
    const data = await service.generateDisbursementList(req.user.id);
    return res.status(201).json({ message: 'تم إنشاء كشف الصرف بنجاح', ...data });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
};

const supervisorApprove = async (req, res, next) => {
  try {
    const list = await service.supervisorApprove(req.params.id, req.user.id);
    return res.json({ message: 'تم اعتماد كشف الصرف بنجاح', list });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

const supervisorReject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const list = await service.supervisorReject(req.params.id, req.user.id, req.body.notes);
    return res.json({ message: 'تم رفض كشف الصرف', list });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

const financeApprove = async (req, res, next) => {
  try {
    const list = await service.financeApprove(req.params.id, req.user.id);
    return res.json({ message: 'تمت المصادقة المالية بنجاح', list });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

const financeReject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const list = await service.financeReject(req.params.id, req.user.id, req.body.notes);
    return res.json({ message: 'تم رد الكشف للمشرف', list });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

const gmRelease = async (req, res, next) => {
  try {
    const list = await service.gmRelease(req.params.id, req.user.id);
    return res.json({ message: 'تم إصدار الأموال بنجاح', list });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

module.exports = {
  getDisbursementLists,
  getDisbursementById,
  generateDisbursementList,
  supervisorApprove,
  supervisorReject,
  financeApprove,
  financeReject,
  gmRelease,
};
