/**
 * orphans.controller.js
 * HTTP handlers for the orphans module.
 *
 * POST   /api/orphans                  → createOrphan     (Agent)
 * GET    /api/orphans                  → getOrphans       (Agent/Supervisor/GM)
 * GET    /api/orphans/marketing        → getOrphansUnderMarketing (GM)
 * GET    /api/orphans/:id              → getOrphanById    (Agent/Supervisor/GM)
 * PATCH  /api/orphans/:id              → updateOrphan     (Agent — under_review only)
 * PATCH  /api/orphans/:id/status       → updateOrphanStatus (Supervisor/GM)
 */

const { validationResult } = require('express-validator');
const service = require('./orphans.service');
const { uploadFile } = require('../../config/s3');

const VALID_RELATIONS = ['uncle', 'maternal_uncle', 'grandfather', 'sibling', 'other'];
const VALID_GENDERS   = ['male', 'female'];

/**
 * POST /api/orphans
 */
const createOrphan = async (req, res, next) => {
  try {
    // 1. Run express-validator checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      governorateId,
      guardianName,
      guardianRelation,
      notes,
    } = req.body;

    // 2. Hard guards — catch anything that slipped past validation
    //    (multer multipart fields can arrive as undefined if not sent)
    if (!gender || !VALID_GENDERS.includes(gender)) {
      return res.status(422).json({
        errors: [{ field: 'gender', msg: 'الجنس مطلوب ويجب أن يكون male أو female' }],
      });
    }

    if (!guardianRelation || !VALID_RELATIONS.includes(guardianRelation)) {
      return res.status(422).json({
        errors: [{ field: 'guardianRelation', msg: 'صلة الوصي مطلوبة ويجب أن تكون قيمة صحيحة' }],
      });
    }

    const isGifted = req.user.role === 'gm' ? req.body.isGifted === 'true' : false;

    // 3. Create orphan record
    const orphan = await service.createOrphan({
      fullName,
      dateOfBirth,
      gender,
      governorateId: parseInt(governorateId, 10),
      guardianName,
      guardianRelation,
      agentId: req.user.id,
      isGifted,
      notes,
    });

    // 4. Upload required documents to S3
    const uploadedDocs = [];

    const filesToUpload = [
      { field: 'deathCert', docType: 'death_certificate', required: true },
      { field: 'birthCert', docType: 'birth_certificate', required: true },
    ];

    for (const { field, docType, required } of filesToUpload) {
      const file = req.files?.[field]?.[0];
      if (!file) {
        if (required) {
          return res.status(422).json({
            errors: [{ msg: `ملف ${field} مطلوب`, field }],
          });
        }
        continue;
      }

      const { key } = await uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: 'documents',
      });

      const doc = await service.addDocument({
        entityType: 'orphan',
        entityId: orphan.id,
        docType,
        fileKey: key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        uploadedBy: req.user.id,
      });
      uploadedDocs.push(doc);
    }

    // 5. Upload optional additional documents (up to 5)
    const additionalFiles = req.files?.additionalDocs || [];
    for (const file of additionalFiles.slice(0, 5)) {
      const { key } = await uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: 'documents',
      });

      const doc = await service.addDocument({
        entityType: 'orphan',
        entityId: orphan.id,
        docType: 'other',
        fileKey: key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        uploadedBy: req.user.id,
      });
      uploadedDocs.push(doc);
    }

    return res.status(201).json({
      message: 'تم تسجيل اليتيم بنجاح وهو الآن في قائمة انتظار المراجعة',
      orphan,
      documents: uploadedDocs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orphans
 */
const getOrphans = async (req, res, next) => {
  try {
    const { status, governorateId, isGifted } = req.query;
    const agentId = req.user.role === 'agent' ? req.user.id : req.query.agentId;

    const orphans = await service.getOrphans({
      status,
      agentId,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      isGifted: isGifted !== undefined ? isGifted === 'true' : undefined,
    });

    return res.json({ orphans });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orphans/marketing
 */
const getOrphansUnderMarketing = async (_req, res, next) => {
  try {
    const orphans = await service.getOrphansUnderMarketing();
    return res.json({ orphans });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orphans/:id
 */
const getOrphanById = async (req, res, next) => {
  try {
    const orphan = await service.getOrphanById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    if (req.user.role === 'agent' && orphan.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }

    const documents = await service.getOrphanDocuments(req.params.id);
    return res.json({ orphan, documents });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/orphans/:id
 */
const updateOrphan = async (req, res, next) => {
  try {
    const existing = await service.getOrphanById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    if (req.user.role === 'agent') {
      if (existing.agent_id !== req.user.id) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لتعديل هذا اليتيم' });
      }
      if (existing.status !== 'under_review') {
        return res.status(400).json({ error: 'لا يمكن تعديل بيانات اليتيم بعد اعتمادها' });
      }
    }

    const orphan = await service.updateOrphan(req.params.id, req.body);
    return res.json({ message: 'تم تحديث بيانات اليتيم', orphan });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/orphans/:id/status
 */
const updateOrphanStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    if (req.user.role === 'supervisor' && status === 'under_sponsorship') {
      return res.status(403).json({ error: 'هذه الصلاحية للمدير العام فقط' });
    }

    const orphan = await service.updateOrphanStatus(
      req.params.id,
      status,
      notes,
      req.user.name
    );

    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    return res.json({ message: 'تم تحديث حالة اليتيم', orphan });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrphan,
  getOrphans,
  getOrphansUnderMarketing,
  getOrphanById,
  updateOrphan,
  updateOrphanStatus,
};
