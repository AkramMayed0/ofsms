'use client';

import { useEffect, useRef } from 'react';

const TYPE_ICON = {
  rejection:    '❌',
  approval:     '✅',
  disbursement: '💰',
  reminder:     '⏰',
  general:      '🔔',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-YE', {
    day:    'numeric',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationPanel({ notifications, loading, onMarkRead, onMarkAllRead, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-12 left-0 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-bold text-gray-800 text-sm">الإشعارات</span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-primary hover:underline"
        >
          تعليم الكل كمقروء
        </button>
      </div>

      {/* List */}
      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {loading && (
          <li className="px-4 py-6 text-center text-gray-400 text-sm">
            جاري التحميل...
          </li>
        )}

        {!loading && notifications.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-400 text-sm">
            لا توجد إشعارات
          </li>
        )}

        {!loading && notifications.map((n) => (
          <li
            key={n.id}
            onClick={() => !n.is_read && onMarkRead(n.id)}
            className={`
              flex gap-3 px-4 py-3 cursor-pointer transition-colors
              ${n.is_read ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'}
            `}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">
              {TYPE_ICON[n.type] || TYPE_ICON.general}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                {n.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(n.created_at)}
              </p>
            </div>

            {!n.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}