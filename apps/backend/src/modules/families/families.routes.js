/**
 * families.routes.js
 * Mounted at: /api/families
 */

const { Router } = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../../middleware/rbac');
const { scanUploadedFiles } = require('../../middleware/fileScanner');
const controller = require('./families.controller');
const validators = require('./families.validators');

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
  scanUploadedFiles,
  validators.createFamilyRules,
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
  validators.updateFamilyRules,
  controller.updateFamily
);

// Supervisor / GM: approve or reject
router.patch(
  '/:id/status',
  authenticate,
  authorize('supervisor', 'gm'),
  validators.updateStatusRules,
  controller.updateFamilyStatus
);

// GM only: share family profile as a sponsor-facing ad/request
router.post(
  '/:id/share',
  authenticate,
  authorize('gm'),
  controller.shareFamilyToAds
);

// ── Multer error handler (must be last) ───────────────────────
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('نوع الملف')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
