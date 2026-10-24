/**
 * settings.controller.js
 * Request handlers for system settings endpoints.
 */

const service = require('./settings.service');

const getSettings = async (req, res, next) => {
  try {
    const settings = await service.getAllSettings();
    return res.json({ status: 'ok', settings });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { identity, numbering_currency, sponsor_messages } = req.body;
    const settingsMap = {};
    if (identity) settingsMap.identity = identity;
    if (numbering_currency) settingsMap.numbering_currency = numbering_currency;
    if (sponsor_messages) settingsMap.sponsor_messages = sponsor_messages;

    const updated = await service.updateSettings(settingsMap, req.user?.id);
    return res.json({ status: 'ok', settings: updated });
  } catch (err) {
    next(err);
  }
};

const getReferenceLists = async (req, res, next) => {
  try {
    const { category } = req.query;
    const items = await service.getReferenceLists(category);
    return res.json({ status: 'ok', items });
  } catch (err) {
    next(err);
  }
};

const addReferenceItem = async (req, res, next) => {
  try {
    const { category, name, description, sort_order, is_active, extra_data } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'الفئة والاسم مطلوبان' });
    }
    const item = await service.addReferenceItem({
      category,
      name,
      description,
      sort_order: sort_order ? parseInt(sort_order, 10) : 10,
      is_active: is_active !== false,
      extra_data
    });
    return res.status(201).json({ status: 'ok', item });
  } catch (err) {
    next(err);
  }
};

const updateReferenceItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sort_order, is_active, extra_data } = req.body;
    const item = await service.updateReferenceItem(id, {
      name,
      description,
      sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : undefined,
      is_active,
      extra_data
    });
    if (!item) {
      return res.status(404).json({ error: 'العنصر غير موجود' });
    }
    return res.json({ status: 'ok', item });
  } catch (err) {
    next(err);
  }
};

const deleteReferenceItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteReferenceItem(id);
    if (!deleted) {
      return res.status(404).json({ error: 'العنصر غير موجود' });
    }
    return res.json({ status: 'ok', id });
  } catch (err) {
    next(err);
  }
};

const getBackups = async (req, res, next) => {
  try {
    const backups = await service.getBackups();
    return res.json({ status: 'ok', backups });
  } catch (err) {
    next(err);
  }
};

const createBackup = async (req, res, next) => {
  try {
    const { backupType = 'manual' } = req.body;
    const backup = await service.createBackup(req.user?.id, backupType);
    return res.status(201).json({ status: 'ok', backup });
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const logs = await service.getAuditLogs(limit);
    return res.json({ status: 'ok', logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getReferenceLists,
  addReferenceItem,
  updateReferenceItem,
  deleteReferenceItem,
  getBackups,
  createBackup,
  getAuditLogs
};
