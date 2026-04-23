/**
 * notifications.service.js — OFSMS Push Notification Service
 *
 * Provides:
 *   sendPushNotification(userId, title, body, data?)
 *     → Sends a FCM multicast message to ALL registered tokens for that user.
 *     → Automatically removes stale/invalid tokens from the DB.
 *     → Persists a notification record in the notifications table.
 *
 *   sendBulkNotification(userIds[], title, body, data?)
 *     → Batch variant used by the monthly cron jobs.
 *
 *   saveNotificationRecord(recipientId, message, type, relatedEntityId?)
 *     → Saves to notifications table (for in-app notification bell).
 *
 * FCM token registration is handled by notifications.routes.js.
 */

const { messaging } = require('../../config/firebase');
const { query }     = require('../../config/db');

// ── Internal: fetch all FCM tokens for a user ─────────────────────────────────
const getUserTokens = async (userId) => {
  const { rows } = await query(
    'SELECT id, token FROM fcm_tokens WHERE user_id = $1',
    [userId]
  );
  return rows; // [{ id, token }, ...]
};

// ── Internal: delete a single stale/invalid token ────────────────────────────
const deleteToken = async (tokenId) => {
  await query('DELETE FROM fcm_tokens WHERE id = $1', [tokenId]);
};

// ── Internal: persist notification record ────────────────────────────────────
const saveNotificationRecord = async (recipientId, message, type = 'general', relatedEntityId = null) => {
  const { rows } = await query(
    `INSERT INTO notifications
       (recipient_id, message, type, related_entity_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [recipientId, message, type, relatedEntityId]
  );
  return rows[0];
};

// ── sendPushNotification ──────────────────────────────────────────────────────
/**
 * Send a push notification to a single user (all their registered devices).
 *
 * @param {string}  userId          - UUID of the recipient user
 * @param {string}  title           - Notification title (shown in browser/OS)
 * @param {string}  body            - Notification body text
 * @param {Object}  [data={}]       - Optional key-value payload (string values only)
 * @param {string}  [type='general']- Notification type for DB record
 * @param {string}  [relatedEntityId] - Optional related entity UUID
 * @returns {Promise<{ sent: number, failed: number }>}
 */
const sendPushNotification = async (
  userId,
  title,
  body,
  data = {},
  type = 'general',
  relatedEntityId = null
) => {
  const tokens = await getUserTokens(userId);

  let sent = 0;
  let failed = 0;

  if (tokens.length > 0) {
    const tokenStrings = tokens.map((t) => t.token);

    const message = {
      tokens: tokenStrings,
      notification: { title, body },
      // data must be Record<string, string> for FCM
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          dir: 'rtl',
          lang: 'ar',
          requireInteraction: false,
        },
        fcmOptions: {
          link: data.link || '/',
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      // Clean up invalid/unregistered tokens
      for (let i = 0; i < response.responses.length; i++) {
        const result = response.responses[i];
        if (!result.success) {
          const errorCode = result.error?.code;
          // These codes mean the token is permanently invalid
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            await deleteToken(tokens[i].id);
          }
          failed++;
        } else {
          sent++;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FCM] sendEachForMulticast error:', err.message);
      failed = tokens.length;
    }
  }

  // Always persist in-app notification record regardless of FCM result
  await saveNotificationRecord(userId, body, type, relatedEntityId);

  return { sent, failed };
};

// ── sendBulkNotification ──────────────────────────────────────────────────────
/**
 * Send the same notification to multiple users (used by cron jobs).
 *
 * @param {string[]} userIds
 * @param {string}   title
 * @param {string}   body
 * @param {Object}   [data={}]
 * @param {string}   [type='general']
 * @returns {Promise<{ total: number, sent: number, failed: number }>}
 */
const sendBulkNotification = async (userIds, title, body, data = {}, type = 'general') => {
  let totalSent   = 0;
  let totalFailed = 0;

  // Send in batches of 10 to avoid overwhelming the DB connection pool
  const BATCH_SIZE = 10;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (uid) => {
        const { sent, failed } = await sendPushNotification(uid, title, body, data, type);
        totalSent   += sent;
        totalFailed += failed;
      })
    );
  }

  return { total: userIds.length, sent: totalSent, failed: totalFailed };
};

module.exports = {
  sendPushNotification,
  sendBulkNotification,
  saveNotificationRecord,
};
