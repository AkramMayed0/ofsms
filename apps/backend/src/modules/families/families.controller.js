/**
 * families.controller.js
 * HTTP handlers for the families module.
 */

const { validationResult } = require('express-validator');
const { uploadFile } = require('../../config/s3');
const service = require('./families.service');

const createFamily = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { familyName, headOfFamily, memberCount, governorateId, notes } = req.body;

    // 1. Create family record (status = under_review automatically)
    const family = await service.createFamily({
      familyName,
      headOfFamily,
      memberCount: parseInt(memberCount, 10),
      governorateId: parseInt(governorateId, 10),
      agentId: req.user.id,
      notes,
    });

    // 2. Upload documents to S3
    const uploadedDocs = [];

    // Optional: head of family ID document
    const headIdFile = req.files?.headOfFamilyId?.[0];
    if (headIdFile) {
      const { key } = await uploadFile({
        buffer: headIdFile.buffer,
        originalName: headIdFile.originalname,
        mimetype: headIdFile.mimetype,
        folder: 'documents',
      });
      const doc = await service.addDocument({
        entityType: 'family',
        entityId: family.id,
        docType: 'guardian_id',
        fileKey: key,
        originalName: headIdFile.originalname,
        uploadedBy: req.user.id,
      });
      uploadedDocs.push(doc);
    }

    // Optional: additional docs (up to 5)
    const additionalFiles = req.files?.additionalDocs || [];
    for (const file of additionalFiles.slice(0, 5)) {
      const { key } = await uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: 'documents',
      });
      const doc = await service.addDocument({
        entityType: 'family',
        entityId: family.id,
        docType: 'other',
        fileKey: key,
        originalName: file.originalname,
        uploadedBy: req.user.id,
      });
      uploadedDocs.push(doc);
    }

    return res.status(201).json({
      message: 'تم تسجيل الأسرة بنجاح وهي الآن في قائمة انتظار المراجعة',
      family,
      documents: uploadedDocs,
    });
  } catch (err) {
    next(err);
  }
};

const getFamilies = async (req, res, next) => {
  try {
    const { status } = req.query;
    const agentId = req.user.role === 'agent' ? req.user.id : req.query.agentId;

    const families = await service.getFamilies({ status, agentId });
    return res.json({ families });
  } catch (err) {
    next(err);
  }
};

const getFamiliesUnderMarketing = async (_req, res, next) => {
  try {
    const families = await service.getFamiliesUnderMarketing();
    return res.json({ families });
  } catch (err) {
    next(err);
  }
};

const getFamilyById = async (req, res, next) => {
  try {
    const family = await service.getFamilyById(req.params.id);
    if (!family) return res.status(404).json({ error: 'الأسرة غير موجودة' });

    if (req.user.role === 'agent' && family.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }

    const documents = await service.getFamilyDocuments(req.params.id);
    return res.json({ family, documents });
  } catch (err) {
    next(err);
  }
};

const updateFamily = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const existing = await service.getFamilyById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'الأسرة غير موجودة' });

    if (req.user.role === 'agent') {
      if (existing.agent_id !== req.user.id) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لتعديل هذه الأسرة' });
      }
      if (existing.status !== 'under_review') {
        return res.status(400).json({ error: 'لا يمكن تعديل الأسرة بعد اعتمادها' });
      }
    }

    const family = await service.updateFamily(req.params.id, req.body);
    return res.json({ message: 'تم تحديث بيانات الأسرة', family });
  } catch (err) {
    next(err);
  }
};

const updateFamilyStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { status, notes } = req.body;

    if (req.user.role === 'supervisor' && status === 'under_sponsorship') {
      return res.status(403).json({ error: 'هذه الصلاحية للمدير العام فقط' });
    }

    const family = await service.updateFamilyStatus(
      req.params.id,
      status,
      notes,
      req.user.name,
      req.user.id
    );

    if (!family) return res.status(404).json({ error: 'الأسرة غير موجودة' });

    return res.json({ message: 'تم تحديث حالة الأسرة', family });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFamily,
  getFamilies,
  getFamilyById,
  getFamiliesUnderMarketing,
  updateFamily,
  updateFamilyStatus,
};