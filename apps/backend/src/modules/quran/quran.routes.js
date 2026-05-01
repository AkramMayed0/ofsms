/**
 * quran.routes.js
 * Mounted at: /api/quran-reports
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./quran.controller');

const router = Router();

// Agent: submit monthly report for an orphan
router.post(
  '/',
  authenticate,
  authorize('agent'),
  [
    body('orphanId').notEmpty().withMessage('معرّف اليتيم مطلوب'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('الشهر غير صحيح'),
    body('year').isInt({ min: 2020 }).withMessage('السنة غير صحيحة'),
    body('juzMemorized')
      .isFloat({ min: 0, max: 30 })
      .withMessage('عدد الأجزاء يجب أن يكون بين 0 و 30'),
  ],
  controller.submitReport
);

// Agent/Supervisor/GM: list reports
router.get(
  '/',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getReports
);

// Supervisor/GM: get single report
router.get(
  '/:id',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getReportById
);

// Supervisor/GM: approve report → orphan included in disbursement
router.patch(
  '/:id/approve',
  authenticate,
  authorize('supervisor', 'gm'),
  controller.approveReport
);

// Supervisor/GM: reject report → orphan excluded from disbursement
router.patch(
  '/:id/reject',
  authenticate,
  authorize('supervisor', 'gm'),
  [body('notes').optional().isString()],
  controller.rejectReport
);

module.exports = router;
