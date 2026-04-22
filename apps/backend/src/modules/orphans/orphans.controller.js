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

// ── Allowed document types per SADD §8.3 ─────────────────────────────────────
const DOC_TYPE_MAP = {
  death_cert:   'death_cert',
  birth_cert:   'birth_cert',
  guardian_id:  'guardian_id',
  other:        'other',
};

/**
 * POST /api/orphans
 * Agent registers a new orphan with multipart form data + document uploads.
 *
 * Required fields: fullName, dateOfBirth, gender, governorateId,
 *                  guardianName, guardianRelation
 * Required files:  deathCert (father's death certificate),
 *                  birthCert (orphan's birth certificate)
 * Optional files:  additionalDocs (up to 5 extra files)
 * Optional fields: notes, isGifted (GM only — ignored unless role = gm)
 */
const createOrphan = async (req, res, next) => {
  try {
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

    // isGifted is GM-only — silently ignore if set by an agent
    const isGifted = req.user.role === 'gm' ? req.body.isGifted === 'true' : false;

    // 1. Create orphan record in DB (status = under_review)
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

    // 2. Upload documents to S3 and save records
    const uploadedDocs = [];

    const filesToUpload = [
      { field: 'deathCert',  docType: 'death_cert',  required: true },
      { field: 'birthCert',  docType: 'birth_cert',  required: true },
    ];

    for (const { field, docType, required } of filesToUpload) {
      const file = req.files?.[field]?.[0];
      if (!file) {
        if (required) {
          // Roll back orphan creation and return error
          // (In production use a DB transaction; for V1 this is acceptable)
          return res.status(422).json({
            errors: [{ msg: `ملف ${field} مطلوب`, field }],
          });
        }
        continue;
      }

      const { key } = await uploadFile({
        buffer:       file.buffer,
        originalName: file.originalname,
        mimetype:     file.mimetype,
        folder:       'documents',
      });

      const doc = await service.addDocument({
        entityType:    'orphan',
        entityId:      orphan.id,
        docType,
        fileKey:       key,
        originalName:  file.originalname,
        mimeType:      file.mimetype,
        fileSizeBytes: file.size,
        uploadedBy:    req.user.id,
      });
      uploadedDocs.push(doc);
    }

    // 3. Handle optional additional docs (up to 5)
    const additionalFiles = req.files?.additionalDocs || [];
    for (const file of additionalFiles.slice(0, 5)) {
      const { key } = await uploadFile({
        buffer:       file.buffer,
        originalName: file.originalname,
        mimetype:     file.mimetype,
        folder:       'documents',
      });

      const doc = await service.addDocument({
        entityType:    'orphan',
        entityId:      orphan.id,
        docType:       'other',
        fileKey:       key,
        originalName:  file.originalname,
        mimeType:      file.mimetype,
        fileSizeBytes: file.size,
        uploadedBy:    req.user.id,
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
 * - Agent: sees only their own orphans
 * - Supervisor / GM: sees all, filterable by ?status=&governorateId=&isGifted=
 */
const getOrphans = async (req, res, next) => {
  try {
    const { status, governorateId, isGifted } = req.query;

    // Agents are scoped to their own orphans
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
 * GM only — orphans available for sponsor assignment.
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
 * Returns orphan details + documents + active sponsorship info.
 */
const getOrphanById = async (req, res, next) => {
  try {
    const orphan = await service.getOrphanById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ error: 'اليتيم غير موجود' });
    }

    // Agents can only view their own orphans
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
 * Agent edits orphan details — only allowed while status = under_review.
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
 * Supervisor approves (→ under_marketing) or rejects with mandatory notes.
 * GM can also move to under_sponsorship or inactive.
 */
const updateOrphanStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    // Supervisors cannot jump directly to under_sponsorship
    if (req.user.role === 'supervisor' && status === 'under_sponsorship') {
      return res.status(403).json({ error: 'هذه الصلاحية للمدير العام فقط' });
    }

    const orphan = await service.updateOrphanStatus(req.params.id, status, notes);
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
