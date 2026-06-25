/**
 * disbursements.controller.js — OFSMS Disbursements HTTP Handler Layer
 *
 * Responsible only for:
 *   - Reading from req (params, body, query, user)
 *   - Calling the service layer
 *   - Writing the HTTP response (status + JSON)
 *
 * No business logic lives here.
 * Errors from the service carry .statusCode and are mapped to HTTP responses.
 */

const { validationResult } = require('express-validator');
const service = require('./disbursements.service');

// ── Shared: map service errors to HTTP responses ──────────────────────────────
const handleError = (err, res, next) => {
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  next(err);
};

// ── GET / ─────────────────────────────────────────────────────────────────────
const getDisbursementLists = async (_req, res, next) => {
  try {
    return res.json({ lists: await service.getDisbursementLists() });
  } catch (err) { handleError(err, res, next); }
};

// ── GET /history ──────────────────────────────────────────────────────────────
const getDisbursementHistory = async (_req, res, next) => {
  try {
    return res.json({ lists: await service.getDisbursementHistory() });
  } catch (err) { handleError(err, res, next); }
};

// ── GET /:id ──────────────────────────────────────────────────────────────────
const getDisbursementById = async (req, res, next) => {
  try {
    const data = await service.getDisbursementById(req.params.id);
    if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });
    return res.json(data);
  } catch (err) { handleError(err, res, next); }
};

// ── GET /agent/released ───────────────────────────────────────────────────────
const getReleasedByAgent = async (req, res, next) => {
  try {
    const agentId = req.user.role === 'agent' ? req.user.id : req.query.agentId;
    if (!agentId) return res.status(400).json({ error: 'agentId مطلوب' });
    const lists = await service.getReleasedListsByAgent(agentId);
    return res.json({ lists });
  } catch (err) { handleError(err, res, next); }
};

// ── POST /generate ────────────────────────────────────────────────────────────
const generateDisbursementList = async (req, res, next) => {
  try {
    const data = await service.generateDisbursementList(req.user.id);
    return res.status(201).json({ message: 'تم إنشاء كشف الصرف بنجاح', ...data });
  } catch (err) { handleError(err, res, next); }
};

// ── PATCH /:id/approve ────────────────────────────────────────────────────────
const supervisorApprove = async (req, res, next) => {
  try {
    const list = await service.supervisorApprove(req.params.id, req.user.id, req.user.role);
    return res.json({ message: 'تم اعتماد كشف الصرف بنجاح', list });
  } catch (err) { handleError(err, res, next); }
};

// ── PATCH /:id/reject ─────────────────────────────────────────────────────────
const supervisorReject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const list = await service.supervisorReject(req.params.id, req.user.id, req.body.notes, req.user.role);
    return res.json({ message: 'تم رفض كشف الصرف', list });
  } catch (err) { handleError(err, res, next); }
};

// ── PATCH /:id/finance-approve ────────────────────────────────────────────────
const financeApprove = async (req, res, next) => {
  try {
    const list = await service.financeApprove(req.params.id, req.user.id, req.user.role);
    return res.json({ message: 'تمت المصادقة المالية بنجاح', list });
  } catch (err) { handleError(err, res, next); }
};

// ── PATCH /:id/finance-reject ─────────────────────────────────────────────────
const financeReject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const list = await service.financeReject(req.params.id, req.user.id, req.body.notes, req.user.role);
    return res.json({ message: 'تم رد الكشف للمشرف', list });
  } catch (err) { handleError(err, res, next); }
};

// ── PATCH /:id/release ────────────────────────────────────────────────────────
const gmRelease = async (req, res, next) => {
  try {
    const list = await service.gmRelease(req.params.id, req.user.id);
    return res.json({ message: 'تم إصدار الأموال بنجاح', list });
  } catch (err) { handleError(err, res, next); }
};

module.exports = {
  getDisbursementLists,
  getDisbursementHistory,
  getDisbursementById,
  getReleasedByAgent,
  generateDisbursementList,
  supervisorApprove,
  supervisorReject,
  financeApprove,
  financeReject,
  gmRelease,
};
