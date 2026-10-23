/**
 * landing.controller.js — Controller for public landing page and CMS settings
 */

const service = require('./landing.service');

const getContent = async (_req, res, next) => {
  try {
    const data = await service.getLandingContent();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
};

const updateContent = async (req, res, next) => {
  try {
    const updated = await service.updateAllLandingContent(req.body);
    res.json({ status: 'ok', data: updated, message: 'تم حفظ التغييرات بنجاح' });
  } catch (err) {
    next(err);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const updated = await service.updateSection(section, req.body);
    res.json({ status: 'ok', data: updated, message: 'تم حفظ تغييرات القسم بنجاح' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContent,
  updateContent,
  updateSection,
};
