/**
 * families.routes.js
 * Mounted at: /api/families
 */

const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { authenticate, authorize } = require('../../middleware/rbac');
const controller = require('./families.controller');

const router = Router();

// ── Multer config ─────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('نوع الملف غير مسموح. المقبول: PDF، JPG، PNG'), false);
  },
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const uploadFields = upload.fields([
  { name: 'headOfFamilyId', maxCount: 1 },
  { name: 'additionalDocs', maxCount: 5 },
]);

// ── Validation rules ──────────────────────────────────────────
const createFamilyRules = [
  body('familyName')
    .trim()
    .notEmpty().withMessage('اسم الأسرة مطلوب')
    .isLength({ min: 3 }).withMessage('الاسم يجب أن يكون 3 أحرف على الأقل'),
  body('headOfFamily')
    .trim()
    .notEmpty().withMessage('اسم رب الأسرة مطلوب'),
  body('memberCount')
    .isInt({ min: 1 }).withMessage('عدد الأفراد يجب أن يكون 1 على الأقل'),
  body('governorateId')
    .isInt({ min: 1 }).withMessage('المحافظة مطلوبة'),
];

const updateStatusRules = [
  body('status')
    .isIn(['under_marketing', 'under_sponsorship', 'rejected', 'inactive'])
    .withMessage('حالة غير صحيحة'),
  body('notes')
    .if(body('status').equals('rejected'))
    .notEmpty().withMessage('ملاحظات الرفض مطلوبة'),
];

// ── Routes ────────────────────────────────────────────────────

// GM only: families available for sponsorship
router.get(
  '/marketing',
  authenticate,
  authorize('gm'),
  controller.getFamiliesUnderMarketing
);

// Agent / Supervisor / GM: list families
router.get(
  '/',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getFamilies
);

// Agent: register a new family (multipart)
router.post(
  '/',
  authenticate,
  authorize('agent'),
  uploadFields,
  createFamilyRules,
  controller.createFamily
);

// All roles: get single family
router.get(
  '/:id',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.getFamilyById
);

// Agent / GM: edit family details
router.patch(
  '/:id',
  authenticate,
  authorize('agent', 'supervisor', 'gm'),
  controller.updateFamily
);

// Supervisor / GM: approve or reject
router.patch(
  '/:id/status',
  authenticate,
  authorize('supervisor', 'gm'),
  updateStatusRules,
  controller.updateFamilyStatus
);

// ── Multer error handler (must be last) ───────────────────────
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('نوع الملف')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;