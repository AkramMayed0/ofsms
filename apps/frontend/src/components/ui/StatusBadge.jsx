'use client';

import React from 'react';

export const STATUS_MAP = {
  // General / Orphans / Families
  under_review: {
    label: 'قيد المراجعة',
    color: '#f59e0b',
    bg: '#fffbeb',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500'
  },
  under_marketing: {
    label: 'تحت التسويق',
    color: '#3b82f6',
    bg: '#eff6ff',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500'
  },
  under_sponsorship: {
    label: 'تحت الكفالة',
    color: '#10b981',
    bg: '#ecfdf5',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  inactive: {
    label: 'غير نشط',
    color: '#9ca3af',
    bg: '#f9fafb',
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    dotClass: 'bg-gray-400'
  },

  // Disbursements
  draft: {
    label: 'مسودة',
    color: '#9ca3af',
    bg: '#f9fafb',
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    dotClass: 'bg-gray-400'
  },
  supervisor_approved: {
    label: 'اعتمد المشرف',
    color: '#f59e0b',
    bg: '#fffbeb',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500'
  },
  finance_approved: {
    label: 'اعتمد المالي',
    color: '#3b82f6',
    bg: '#eff6ff',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    dotClass: 'bg-blue-500'
  },
  released: {
    label: 'تم الصرف',
    color: '#10b981',
    bg: '#ecfdf5',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500'
  },

  // Quran Reports
  pending: {
    label: 'قيد المراجعة',
    color: '#f59e0b',
    bg: '#fffbeb',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500'
  },
  approved: {
    label: 'معتمد',
    color: '#10b981',
    bg: '#ecfdf5',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500'
  },

  // Common/Shared
  rejected: {
    label: 'مرفوض',
    color: '#ef4444',
    bg: '#fef2f2',
    textClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500'
  }
};

export default function StatusBadge({ status, className = '', style }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.inactive;

  // Merge custom styling overrides if style is passed explicitly
  const badgeStyle = style ? {
    color: cfg.color,
    background: cfg.bg,
    borderColor: `${cfg.color}25`,
    ...style
  } : undefined;

  // Prevent conflicting classes (detect custom padding/size overrides)
  const hasPadding = /\bp[xy]-\b/.test(className);
  const hasTextSize = /\btext-\b/.test(className);

  const defaultPadding = hasPadding ? '' : 'px-2.5 py-0.5';
  const defaultTextSize = hasTextSize ? '' : 'text-[0.72rem]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border whitespace-nowrap ${defaultPadding} ${defaultTextSize} ${badgeStyle ? '' : `${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`} ${className}`}
      style={badgeStyle}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`}
        style={style ? { background: cfg.color } : undefined}
      />
      {cfg.label}
    </span>
  );
}
