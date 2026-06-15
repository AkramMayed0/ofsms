const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const { authenticateSponsor } = require('../../middleware/sponsorAuth');
const service = require('./ads.service');

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('gm'),
  async (_req, res, next) => {
    try {
      const ads = await service.getAds();
      return res.json({ ads });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      const ad = await service.getAdById(req.params.id);
      if (!ad) return res.status(404).json({ error: 'الإعلان غير موجود' });
      if (!ad.is_sponsored) {
        return res.status(400).json({ error: 'لا يمكن حذف الإعلان قبل اكتمال الكفالة' });
      }
      await service.deleteAd(req.params.id);
      return res.json({ message: 'تم حذف الإعلان من صفحة الإعلانات' });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/sponsor/feed',
  authenticateSponsor,
  async (req, res, next) => {
    try {
      const ads = await service.getAdsForSponsor(req.sponsor.id);
      return res.json({ ads });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
