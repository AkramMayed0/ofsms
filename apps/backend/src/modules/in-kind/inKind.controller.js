/**
 * inKind.controller.js — Controller for in-kind support programs API
 */

const service = require('./inKind.service');

// ── Types ────────────────────────────────────────────────────────────────────

const getTypes = async (_req, res, next) => {
  try {
    const types = await service.getTypes();
    res.json({ status: 'ok', data: types });
  } catch (err) {
    next(err);
  }
};

const createType = async (req, res, next) => {
  try {
    const { name, unit } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم نوع الدعم مطلوب' });
    }
    const created = await service.createType({ name, unit });
    res.status(201).json({ status: 'ok', data: created, message: 'تمت إضافة نوع الدعم بنجاح' });
  } catch (err) {
    next(err);
  }
};

const deleteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteType(id);
    if (!deleted) {
      return res.status(404).json({ error: 'نوع الدعم غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تم حذف نوع الدعم' });
  } catch (err) {
    next(err);
  }
};

// ── Programs ─────────────────────────────────────────────────────────────────

const getPrograms = async (req, res, next) => {
  try {
    const { status, typeId, sponsorId, search } = req.query;
    const programs = await service.getPrograms({ status, typeId, sponsorId, search });
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
      return res.status(404).json({ error: 'برنامج الدعم غير موجود' });
    }
    res.json({ status: 'ok', data: program });
  } catch (err) {
    next(err);
  }
};

const createProgram = async (req, res, next) => {
  try {
    const { title, typeId, sponsorId, status, startDate, endDate, targetQuantity, notes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'عنوان برنامج الدعم مطلوب' });
    }
    const created = await service.createProgram({
      title,
      typeId,
      sponsorId,
      status,
      startDate,
      endDate,
      targetQuantity,
      notes,
      userId: req.user?.id,
    });
    res.status(201).json({ status: 'ok', data: created, message: 'تم إنشاء برنامج الدعم بنجاح' });
  } catch (err) {
    next(err);
  }
};

const updateProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await service.updateProgram(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'برنامج الدعم غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تحديث برنامج الدعم بنجاح' });
  } catch (err) {
    next(err);
  }
};

const deleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteProgram(id);
    if (!deleted) {
      return res.status(404).json({ error: 'برنامج الدعم غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تم حذف برنامج الدعم' });
  } catch (err) {
    next(err);
  }
};

// ── Beneficiaries Assignment ─────────────────────────────────────────────────

const addBeneficiaries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { beneficiaries } = req.body; // array of items or single item
    if (!beneficiaries || !Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      return res.status(400).json({ error: 'قائمة المستفيدين مطلوبة' });
    }
    const added = await service.addMultipleBeneficiaries(id, beneficiaries);
    res.status(201).json({ status: 'ok', data: added, message: `تمت إضافة ${added.length} مستفيد إلى البرنامج بنجاح` });
  } catch (err) {
    next(err);
  }
};

const markDelivery = async (req, res, next) => {
  try {
    const { beneficiaryId } = req.params;
    const { status = 'delivered', deliveredAt, receiverName, receiverRelation, deliveryMethod, notes } = req.body;
    const updated = await service.updateBeneficiaryDelivery(beneficiaryId, {
      status,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
      deliveredBy: req.user?.id,
      receiverName,
      receiverRelation,
      deliveryMethod,
      notes,
    });
    if (!updated) {
      return res.status(404).json({ error: 'سجل المستفيد غير موجود' });
    }
    res.json({ status: 'ok', data: updated, message: 'تم تأكيد استلام المساعدة بنجاح' });
  } catch (err) {
    next(err);
  }
};

const removeBeneficiary = async (req, res, next) => {
  try {
    const { beneficiaryId } = req.params;
    const deleted = await service.removeBeneficiary(beneficiaryId);
    if (!deleted) {
      return res.status(404).json({ error: 'سجل المستفيد غير موجود' });
    }
    res.json({ status: 'ok', data: deleted, message: 'تمت إزالة المستفيد من البرنامج' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTypes,
  createType,
  deleteType,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  addBeneficiaries,
  markDelivery,
  removeBeneficiary,
};
