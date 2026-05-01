/**
 * quran.controller.js
 */

const { validationResult } = require('express-validator');
const service = require('./quran.service');

const submitReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const { orphanId, month, year, juzMemorized } = req.body;
    const report = await service.submitReport({
      orphanId, agentId: req.user.id,
      month: parseInt(month), year: parseInt(year),
      juzMemorized: parseFloat(juzMemorized),
    });
    return res.status(201).json({ message: 'تم رفع تقرير الحفظ بنجاح', report });
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status, month, year } = req.query;
    const agentId = req.user.role === 'agent' ? req.user.id : req.query.agentId;
    const reports = await service.getReports({
      agentId, status,
      month: month ? parseInt(month) : undefined,
      year:  year  ? parseInt(year)  : undefined,
    });
    return res.json({ reports });
  } catch (err) { next(err); }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await service.getReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'التقرير غير موجود' });
    return res.json({ report });
  } catch (err) { next(err); }
};

const approveReport = async (req, res, next) => {
  try {
    const report = await service.approveReport(req.params.id, req.user.id);
    return res.json({ message: 'تم اعتماد تقرير الحفظ', report });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

const rejectReport = async (req, res, next) => {
  try {
    const report = await service.rejectReport(req.params.id, req.body.notes);
    return res.json({ message: 'تم رفض تقرير الحفظ', report });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
};

module.exports = { submitReport, getReports, getReportById, approveReport, rejectReport };
