/**
 * offlineStorage.js — OFSMS Client-side Offline Storage & Cache Manager
 *
 * Persists data (reports, orphans, evaluations, families, etc.) on the client device
 * so the agent / client can view reports and browse all data completely offline.
 *
 * When the device is offline:
 * - GET requests return the stored cache.
 * - POST / PUT / DELETE mutations are blocked with a clear message:
 *   "أنت في وضع عدم الاتصال بالإنترنت. يلزم توفر اتصال بالإنترنت لإرسال أو تحديث البيانات."
 */

const CACHE_PREFIX = 'ofsms_offline_data_';
const CACHE_INDEX_KEY = 'ofsms_offline_index';

// ── Check if client is online ─────────────────────────────────────────────────
export function isOnline() {
  if (typeof window === 'undefined') return true;
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

// ── Normalize cache key from URL and params ───────────────────────────────────
export function getCacheKey(url, params = {}) {
  const cleanUrl = url.replace(/^[a-z]+:\/\/[^/]+/i, '').split('?')[0];
  const queryStr = Object.keys(params || {})
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${CACHE_PREFIX}${cleanUrl}${queryStr ? '?' + queryStr : ''}`;
}

// ── Save data to offline cache ────────────────────────────────────────────────
export function saveOfflineData(url, params, data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const key = getCacheKey(url, params);
    const entry = {
      cachedAt: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(entry));

    // Update index of cached keys
    const rawIndex = localStorage.getItem(CACHE_INDEX_KEY);
    const index = rawIndex ? JSON.parse(rawIndex) : [];
    if (!index.includes(key)) {
      index.push(key);
      localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
    }
  } catch (err) {
    // If quota exceeded, remove oldest entries
    console.warn('Offline cache write failed (quota?):', err.message);
  }
}

// ── Get data from offline cache ────────────────────────────────────────────────
export function getOfflineData(url, params) {
  if (typeof window === 'undefined') return null;
  try {
    const key = getCacheKey(url, params);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return entry;
  } catch {
    return null;
  }
}

// ── Clear offline cache ───────────────────────────────────────────────────────
export function clearOfflineCache() {
  if (typeof window === 'undefined') return;
  try {
    const rawIndex = localStorage.getItem(CACHE_INDEX_KEY);
    if (rawIndex) {
      const keys = JSON.parse(rawIndex);
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(CACHE_INDEX_KEY);
    }
  } catch (err) {
    console.warn('Error clearing offline cache:', err);
  }
}
