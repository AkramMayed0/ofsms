/**
 * families.controller.js
 * HTTP handlers for the families module.
 */

const service = require('./families.service');
const adsService = require('../ads/ads.service');

const createFamily = async (req, res, next) => {
  try {
    const { familyName, headOfFamily, memberCount, governorateId, notes } = req.body;

    const result = await service.createFamily(
      {
        familyName,
        headOfFamily,
        memberCount,
        governorateId,
        agentId: req.user.id,
        notes,
      },
      req.files
    );

    return res.status(201).json({
      message: 'تم تسجيل الأسرة بنجاح وهي الآن في قائمة انتظار المراجعة',
      family: result.family,
      documents: result.documents,
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
    const result = await service.getFamilyById(req.params.id, req.user.role, req.user.id);
    return res.json(result);
  } catch (err) {
    // If the error has a statusCode, it will be handled by our global error handler (if it supports it)
    // or we map it directly here to be safe.
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

const updateFamily = async (req, res, next) => {
  try {
    const family = await service.updateFamily(req.params.id, req.body, req.user.role, req.user.id);
    return res.json({ message: 'تم تحديث بيانات الأسرة', family });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

const updateFamilyStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const family = await service.updateFamilyStatus(
      req.params.id,
      status,
      notes,
      req.user.name,
      req.user.id,
      req.user.role
    );

    return res.json({ message: 'تم تحديث حالة الأسرة', family });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

const shareFamilyToAds = async (req, res, next) => {
  try {
    const { targetAll = true, sponsorIds = [] } = req.body || {};
    const shareWithAll = targetAll === true || targetAll === 'true';
    if (!shareWithAll && (!Array.isArray(sponsorIds) || sponsorIds.length === 0)) {
      return res.status(400).json({ error: 'يرجى اختيار كافل واحد على الأقل أو اختيار جميع الكفلاء' });
    }
    
    // We can still use service.getFamilyById to get the family safely
    const { family } = await service.getFamilyById(req.params.id, req.user.role, req.user.id);
    
    if (family.status !== 'under_marketing') {
      return res.status(400).json({ error: 'يمكن مشاركة الأسر تحت التسويق فقط' });
    }
    if (family.sponsor_name) {
      return res.status(400).json({ error: 'لا يمكن مشاركة أسرة لديها كافل حالي' });
    }

    const ad = await adsService.createAd({
      beneficiaryType: 'family',
      beneficiaryId: family.id,
      createdBy: req.user.id,
      targetAll: shareWithAll,
      sponsorIds,
    });

    return res.status(201).json({
      message: 'تمت مشاركة بيانات الأسرة مع واجهة الكافل',
      ad,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
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
  shareFamilyToAds,
};
