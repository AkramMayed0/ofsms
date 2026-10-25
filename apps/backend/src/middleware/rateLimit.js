/**
 * rateLimit.js — tiny in-memory rate limiter (no extra dependency).
 *
 * Used on login endpoints to slow down password guessing.
 * State is per server process, which is enough for a single Render instance.
 */

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) => {
  const hits = new Map(); // ip -> { count, resetAt }

  // Drop expired entries so the map cannot grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: message || 'محاولات كثيرة، يرجى المحاولة لاحقاً بعد بضع دقائق',
      });
    }
    return next();
  };
};

module.exports = { rateLimit };
