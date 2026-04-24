const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const service = require('./quranReports.service');

const router = Router();

// POST /api/quran-reports — agent submits a report
router.post(
  '/',
  authenticate,
  authorize('agent'),
  [
    body('orphanId').isUUID().withMessage('معرّف اليتيم غير صحيح'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('الشهر يجب أن يكون بين 1 و 12'),
    body('year').isInt({ min: 2020 }).withMessage('السنة غير صحيحة'),
    body('juzMemorized')
      .isFloat({ min: 0 })
      .withMessage('عدد الأجزاء يجب أن يكون صفرًا أو أكثر'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { orphanId, month, year, juzMemorized } = req.body;

      const result = await service.submitReport({
        orphanId,
        agentId: req.user.id,
        month: parseInt(month),
        year: parseInt(year),
        juzMemorized: parseFloat(juzMemorized),
      });

      return res.status(201).json({
        message: 'تم رفع تقرير الحفظ بنجاح وهو الآن في قائمة انتظار المشرف',
        ...result,
      });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

// GET /api/quran-reports/pending — supervisor sees all pending reports
router.get(
  '/pending',
  authenticate,
  authorize('supervisor', 'gm'),
  async (_req, res, next) => {
    try {
      const reports = await service.getPendingReports();
      return res.json({ reports, total: reports.length });
    } catch (err) { next(err); }
  }
);

// GET /api/quran-reports/mine — agent sees their own submitted reports
router.get(
  '/mine',
  authenticate,
  authorize('agent'),
  async (req, res, next) => {
    try {
      const reports = await service.getReportsByAgent(req.user.id);
      return res.json({ reports });
    } catch (err) { next(err); }
  }
);

module.exports = router;