/**
 * educational.controller.js — Controller for Educational & Awareness Programs
 */

const service = require('./educational.service');

// ── Categories ───────────────────────────────────────────────────────────────

const getCategories = async (_req, res, next) => {
  try {
    const categories = await service.getCategories();
    res.json({ status: 'ok', data: categories });
  } catch (err) {
    next(err);
  }
};

// ── Templates ────────────────────────────────────────────────────────────────

const getTemplates = async (req, res, next) => {
  try {
    const { search, categoryId } = req.query;
    const templates = await service.getTemplates({ search, categoryId });
    res.json({ status: 'ok', data: templates });
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { title, categoryId, description, defaultDurationDays, defaultSessions, targetAudience } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'عنوان القالب مطلوب' });
    }
    const created = await service.createTemplate({
      title,
      categoryId,
      description,
      defaultDurationDays,
      defaultSessions,
      targetAudience,
      userId: req.user?.id,
    });
    res.status(201).json({ status: 'ok', data: created, message: 'تم إنشاء القالب بنجاح' });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await service.updateTemplate(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'القالب غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تحديث القالب بنجاح' });
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteTemplate(id);
    if (!deleted) {
      return res.status(404).json({ error: 'القالب غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تم حذف القالب' });
  } catch (err) {
    next(err);
  }
};

// ── Programs ─────────────────────────────────────────────────────────────────

const getPrograms = async (req, res, next) => {
  try {
    const { status, categoryId, search } = req.query;
    const programs = await service.getPrograms({ status, categoryId, search });
    res.json({ status: 'ok', data: programs });
  } catch (err) {
    next(err);
  }
};

const getProgramById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const program = await service.getProgramById(id);
    if (!program) {
      return res.status(404).json({ error: 'البرنامج غير موجود' });
    }
    res.json({ status: 'ok', data: program });
  } catch (err) {
    next(err);
  }
};

const createProgram = async (req, res, next) => {
  try {
    const {
      title,
      categoryId,
      templateId,
      status,
      location,
      startDate,
      endDate,
      totalSessions,
      targetCount,
      instructorName,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'عنوان البرنامج مطلوب' });
    }

    const created = await service.createProgram({
      title,
      categoryId,
      templateId,
      status,
      location,
      startDate,
      endDate,
      totalSessions,
      targetCount,
      instructorName,
      notes,
      userId: req.user?.id,
    });

    res.status(201).json({ status: 'ok', data: created, message: 'تم إنشاء البرنامج بنجاح' });
  } catch (err) {
    next(err);
  }
};

const updateProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await service.updateProgram(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'البرنامج غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تحديث البرنامج بنجاح' });
  } catch (err) {
    next(err);
  }
};

const updateProgramStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['draft', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'حالة البرنامج غير صالحة' });
    }
    const updated = await service.updateProgramStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'البرنامج غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تحديث حالة البرنامج بنجاح' });
  } catch (err) {
    next(err);
  }
};

const deleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteProgram(id);
    if (!deleted) {
      return res.status(404).json({ error: 'البرنامج غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تم حذف البرنامج' });
  } catch (err) {
    next(err);
  }
};

// ── Participants ─────────────────────────────────────────────────────────────

const addParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orphanIds } = req.body;
    if (!orphanIds || !Array.isArray(orphanIds) || orphanIds.length === 0) {
      return res.status(400).json({ error: 'يرجى تحديد أيتام لإضافتهم كـ مشاركين' });
    }
    const added = await service.addParticipants(id, orphanIds);
    res.status(201).json({
      status: 'ok',
      data: added,
      message: `تمت إضافة ${added.length} يتيم إلى البرنامج بنجاح`,
    });
  } catch (err) {
    next(err);
  }
};

const updateParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const updated = await service.updateParticipant(participantId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'سجل المشارك غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تحديث بيانات المشارك' });
  } catch (err) {
    next(err);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const deleted = await service.removeParticipant(participantId);
    if (!deleted) {
      return res.status(404).json({ error: 'سجل المشارك غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تمت إزالة المشارك من البرنامج' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  updateProgramStatus,
  deleteProgram,
  addParticipants,
  updateParticipant,
  removeParticipant,
};
