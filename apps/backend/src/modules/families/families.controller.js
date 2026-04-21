/**
 * families.controller.js
 * HTTP handlers for the families module.
 */

const { validationResult } = require('express-validator');
const service = require('./families.service');

/**
 * POST /api/families
 * Agent — register a new family (status starts as under_review).
 */
const createFamily = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { familyName, headOfFamily, memberCount, governorateId, notes } = req.body;

    const family = await service.createFamily({
      familyName,
      headOfFamily,
      memberCount,
      governorateId,
      agentId: req.user.id,  // always the logged-in agent
      notes,
    });

    return res.status(201).json({ message: 'تم تسجيل الأسرة بنجاح', family });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/families
 * - Agent: sees only their own families
 * - Supervisor / GM: sees all families, filterable by status
 */
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

/**
 * GET /api/families/marketing
 * GM only — families available for sponsorship assignment.
 */
const getFamiliesUnderMarketing = async (_req, res, next) => {
  try {
    const families = await service.getFamiliesUnderMarketing();
    return res.json({ families });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/families/:id
 * Get a single family with documents.
 */
const getFamilyById = async (req, res, next) => {
  try {
    const family = await service.getFamilyById(req.params.id);
    if (!family) return res.status(404).json({ error: 'الأسرة غير موجودة' });

    // Agents can only view their own families
    if (req.user.role === 'agent' && family.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }

    const documents = await service.getFamilyDocuments(req.params.id);
    return res.json({ family, documents });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/families/:id
 * Agent — edit family details (only while under_review).
 */
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

/**
 * PATCH /api/families/:id/status
 * Supervisor — approve (→ under_marketing) or reject with notes.
 * GM — can also move to under_sponsorship.
 */
const updateFamilyStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { status, notes } = req.body;

    // Supervisors cannot move directly to under_sponsorship
    if (req.user.role === 'supervisor' && status === 'under_sponsorship') {
      return res.status(403).json({ error: 'هذه الصلاحية للمدير العام فقط' });
    }

    const family = await service.updateFamilyStatus(req.params.id, status, notes);
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
