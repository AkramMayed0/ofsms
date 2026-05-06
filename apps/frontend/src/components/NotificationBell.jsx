'use client';

/**
 * NotificationBell.jsx
 * Reusable notification bell for AppShell top bar.
 *
 * - Fetches GET /api/notifications on mount + every 30s
 * - Shows unread badge count (capped at 99+)
 * - Click → dropdown with last 20 notifications
 * - "Mark all as read" → PATCH /api/notifications/read-all
 * - Click individual → PATCH /api/notifications/:id/read
 * - Closes on outside click / Escape
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

// ── Type → Arabic label + color ──────────────────────────────────────────────

const TYPE_CONFIG = {
  registration_approved:  { label: 'اعتماد تسجيل',    color: '#10b981', icon: '✅' },
  registration_rejected:  { label: 'رفض تسجيل',       color: '#ef4444', icon: '❌' },
  quran_report_reminder:  { label: 'تذكير تقرير',      color: '#f59e0b', icon: '📖' },
  disbursement_reminder:  { label: 'تذكير الصرف',      color: '#3b82f6', icon: '💰' },
  disbursement_approved:  { label: 'اعتماد الصرف',     color: '#10b981', icon: '✔' },
  disbursement_rejected:  { label: 'رفض الصرف',        color: '#ef4444', icon: '✗' },
  general:                { label: 'إشعار',             color: '#6b7280', icon: '🔔' },
};

// ── Relative time helper ───────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [markingAll,    setMarkingAll]    = useState(false);

  const dropdownRef = useRef(null);
  const buttonRef   = useRef(null);

  // ── Fetch notifications ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=20');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // silently fail — don't break the layout
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Close on outside click or Escape ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // ── Mark single as read ──────────────────────────────────────────────────────
  const markOneRead = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // revert on failure
      fetchNotifications();
    }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all');
    } catch {
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Badge label ──────────────────────────────────────────────────────────────
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="notif-root" dir="rtl">

      {/* ── Bell button ── */}
      <button
        ref={buttonRef}
        className={`notif-btn ${open ? 'notif-btn-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`الإشعارات${unreadCount > 0 ? ` - ${unreadCount} غير مقروء` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Bell SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {badgeLabel}
          </span>
        )}

        {/* Pulse ring when unread */}
        {unreadCount > 0 && <span className="notif-pulse" aria-hidden="true" />}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          ref={dropdownRef}
          className="notif-dropdown"
          role="dialog"
          aria-label="الإشعارات"
        >
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <h3 className="notif-title">الإشعارات</h3>
              {unreadCount > 0 && (
                <span className="notif-header-badge">{unreadCount} جديد</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={markAllRead}
                disabled={markingAll}
                aria-label="تعليم الكل كمقروء"
              >
                {markingAll ? 'جارٍ…' : 'قراءة الكل'}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="notif-body">
            {loading ? (
              /* Skeleton */
              <div className="notif-skeletons">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="notif-skel">
                    <div className="skel skel-icon" />
                    <div className="skel-lines">
                      <div className="skel skel-line-1" />
                      <div className="skel skel-line-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              /* Empty */
              <div className="notif-empty">
                <span className="notif-empty-icon">🔔</span>
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              /* Notification list */
              <ul className="notif-list" role="list">
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                  return (
                    <li
                      key={n.id}
                      className={`notif-item ${!n.is_read ? 'notif-item-unread' : ''}`}
                      onClick={() => markOneRead(n.id)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && markOneRead(n.id)}
                    >
                      {/* Unread dot */}
                      {!n.is_read && (
                        <span className="unread-dot" aria-label="غير مقروء" />
                      )}

                      {/* Icon */}
                      <div
                        className="notif-icon-wrap"
                        style={{ background: `${cfg.color}18`, color: cfg.color }}
                        aria-hidden="true"
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="notif-content">
                        <p className="notif-msg">{n.message}</p>
                        <div className="notif-meta">
                          <span
                            className="notif-type-tag"
                            style={{ color: cfg.color, background: `${cfg.color}12` }}
                          >
                            {cfg.label}
                          </span>
                          <span className="notif-time">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="notif-footer">
              <span className="notif-footer-text">
                آخر {notifications.length} إشعار
              </span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        /* ── Root ─────────────────────────────────────────────────────── */
        .notif-root {
          position: relative;
          display: inline-flex;
        }

        /* ── Bell button ──────────────────────────────────────────────── */
        .notif-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 0.75rem;
          cursor: pointer;
          color: #6b7280;
          transition: background 0.15s, color 0.15s;
        }
        .notif-btn:hover { background: #f3f4f6; color: #1B5E8C; }
        .notif-btn-open  { background: #f0f7ff; color: #1B5E8C; }

        /* ── Badge ────────────────────────────────────────────────────── */
        .notif-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          min-width: 17px;
          height: 17px;
          padding: 0 3px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #fff;
          line-height: 1;
        }

        /* ── Pulse ring ───────────────────────────────────────────────── */
        .notif-pulse {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #ef4444;
          opacity: 0;
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* ── Dropdown ─────────────────────────────────────────────────── */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 360px;
          max-width: calc(100vw - 2rem);
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.07),
            0 10px 30px -5px rgba(27,94,140,0.12);
          z-index: 100;
          overflow: hidden;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 1.1rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .notif-header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .notif-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0;
          font-family: 'Cairo', sans-serif;
        }
        .notif-header-badge {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          font-family: 'Cairo', sans-serif;
        }
        .mark-all-btn {
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1B5E8C;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          transition: background 0.12s;
          white-space: nowrap;
        }
        .mark-all-btn:hover { background: #f0f7ff; }
        .mark-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Body ─────────────────────────────────────────────────────── */
        .notif-body {
          max-height: 380px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .notif-body::-webkit-scrollbar { width: 4px; }
        .notif-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

        /* ── Skeletons ────────────────────────────────────────────────── */
        .notif-skeletons {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .notif-skel {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 1.1rem;
          border-bottom: 1px solid #f9fafb;
        }
        .skel {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 4px;
        }
        .skel-icon  { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
        .skel-lines { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
        .skel-line-1 { height: 12px; width: 85%; }
        .skel-line-2 { height: 10px; width: 50%; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Empty ────────────────────────────────────────────────────── */
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2.5rem 1rem;
          color: #9ca3af;
        }
        .notif-empty-icon { font-size: 2rem; opacity: 0.5; }
        .notif-empty p {
          font-size: 0.83rem;
          font-weight: 600;
          margin: 0;
          font-family: 'Cairo', sans-serif;
        }

        /* ── Notification list ────────────────────────────────────────── */
        .notif-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .notif-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 1.1rem;
          border-bottom: 1px solid #f9fafb;
          cursor: pointer;
          transition: background 0.12s;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #f8fbff; }
        .notif-item:focus { outline: 2px solid #1B5E8C; outline-offset: -2px; }
        .notif-item-unread { background: #fafcff; }
        .notif-item-unread:hover { background: #f0f7ff; }

        /* Unread dot */
        .unread-dot {
          position: absolute;
          top: 1rem;
          left: 0.7rem;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1B5E8C;
          flex-shrink: 0;
        }

        /* Type icon */
        .notif-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          margin-right: 0.2rem;  /* extra gap from unread dot */
        }

        /* Content */
        .notif-content { flex: 1; min-width: 0; }
        .notif-msg {
          font-size: 0.8rem;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 0.3rem;
          line-height: 1.5;
          font-family: 'Cairo', sans-serif;
          /* Clamp to 2 lines */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notif-item-unread .notif-msg { font-weight: 700; }
        .notif-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .notif-type-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          font-family: 'Cairo', sans-serif;
        }
        .notif-time {
          font-size: 0.68rem;
          color: #9ca3af;
          font-family: 'Cairo', sans-serif;
        }

        /* ── Footer ───────────────────────────────────────────────────── */
        .notif-footer {
          padding: 0.6rem 1.1rem;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
        }
        .notif-footer-text {
          font-size: 0.72rem;
          color: #9ca3af;
          font-family: 'Cairo', sans-serif;
        }
      `}</style>
    </div>
  );
}
