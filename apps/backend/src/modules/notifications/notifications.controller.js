/**
 * notifications.controller.js
 * HTTP handlers for the notifications module.
 */

const repository = require('./notifications.repository');
const service    = require('./notifications.service');

const registerToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userAgent = req.headers['user-agent'] || null;
    await repository.registerToken(req.user.id, token, userAgent);
    return res.json({ message: 'تم تسجيل الجهاز للإشعارات بنجاح' });
  } catch (err) {
    next(err);
  }
};

const unregisterToken = async (req, res, next) => {
  try {
    await repository.unregisterToken(req.body.token, req.user.id);
    return res.json({ message: 'تم إلغاء تسجيل الجهاز' });
  } catch (err) {
    next(err);
  }
};

const listNotifications = async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await repository.getNotifications(req.user.id, limit, offset);
    const unread_count  = await repository.getUnreadCount(req.user.id);

    return res.json({ notifications, unread_count });
  } catch (err) {
    next(err);
  }
};

const markOneRead = async (req, res, next) => {
  try {
    const result = await repository.markOneRead(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ error: 'الإشعار غير موجود' });
    return res.json({ message: 'تم تعليم الإشعار كمقروء' });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await repository.markAllRead(req.user.id);
    return res.json({ message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (err) {
    next(err);
  }
};

const broadcast = async (req, res, next) => {
  try {
    const { message, targets, userIds } = req.body;

    const result = await service.broadcastNotification(message, targets, userIds, req.user.id);

    return res.json({
      message: 'تم إرسال الإشعار بنجاح',
      recipients: result.total,
      delivered: result.sent,
      failed: result.failed,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};

const triggerCron = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'غير متاح في بيئة الإنتاج' });
  }

  const {
    remindAgentsToSubmitReports,
    remindSupervisorToFollowUp,
    remindDisbursementDeadline,
  } = require('../../scheduler');

  const { job } = req.body;

  try {
    if (job === 'agents')            await remindAgentsToSubmitReports();
    else if (job === 'supervisor')   await remindSupervisorToFollowUp();
    else if (job === 'disbursement') await remindDisbursementDeadline();
    else return res.status(400).json({ error: 'job يجب أن يكون: agents | supervisor | disbursement' });

    return res.json({ message: `تم تشغيل المهمة المجدولة: ${job}` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  listNotifications,
  markOneRead,
  markAllRead,
  broadcast,
  triggerCron,
};
