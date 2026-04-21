/**
 * sponsors.controller.js
 * Handles HTTP requests for the sponsors module.
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const service = require('./sponsors.service');

/**
 * POST /api/sponsors
 * GM only — create a new sponsor and generate their portal token.
 */
const createSponsor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { fullName, phone, email, portalPassword } = req.body;

    const portalPasswordHash = await bcrypt.hash(portalPassword, 12);

    const sponsor = await service.createSponsor({
      fullName,
      phone,
      email,
      portalPasswordHash,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: 'تم إنشاء الكافل بنجاح',
      sponsor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sponsors
 * GM only — list all sponsors with active sponsorship count.
 */
const getAllSponsors = async (_req, res, next) => {
  try {
    const sponsors = await service.getAllSponsors();
    return res.json({ sponsors });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sponsors/:id
 * GM only — get a single sponsor with their sponsorships.
 */
const getSponsorById = async (req, res, next) => {
  try {
    const sponsor = await service.getSponsorById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ error: 'الكافل غير موجود' });
    }

    const sponsorships = await service.getSponsorshipsBySponsorId(req.params.id);
    return res.json({ sponsor, sponsorships });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sponsors/:id/sponsorships
 * GM only — assign a beneficiary to this sponsor.
 */
const createSponsorship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { beneficiaryType, beneficiaryId, agentId, intermediary, startDate, monthlyAmount } =
      req.body;

    const sponsorship = await service.createSponsorship({
      sponsorId: req.params.id,
      beneficiaryType,
      beneficiaryId,
      agentId,
      intermediary,
      startDate,
      monthlyAmount,
    });

    return res.status(201).json({
      message: 'تم تعيين الكفالة بنجاح',
      sponsorship,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sponsors/transfer
 * GM only — transfer a beneficiary from one sponsor to another.
 */
const transferSponsorship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { beneficiaryType, beneficiaryId, newSponsorId, agentId, monthlyAmount, endReason } =
      req.body;

    const sponsorship = await service.transferSponsorship({
      beneficiaryType,
      beneficiaryId,
      newSponsorId,
      agentId,
      monthlyAmount,
      endReason,
    });

    return res.status(200).json({
      message: 'تم نقل الكفالة بنجاح',
      sponsorship,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSponsor,
  getAllSponsors,
  getSponsorById,
  createSponsorship,
  transferSponsorship,
};
