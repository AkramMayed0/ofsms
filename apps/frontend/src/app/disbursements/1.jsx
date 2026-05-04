'use client';

/**
 * page.jsx
 * Route: /disbursements  (GM + Supervisor + Finance)
 * API:   GET /api/disbursements → list all disbursement lists
 *
 * Shows all monthly disbursement cycles with status, totals, and
 * a link to the detail page where GM can take approval actions.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    label: 'مسودة',
    labelEn: 'Draft',
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FCD34D',
    icon: '📝',
    step: 1,
  },
  supervisor_approved: {
    label: 'اعتمد المشرف',
    labelEn: 'Supervisor Approved',
    color: '#1E40AF',
    bg: '#EFF6FF',
    border: '#93C5FD',
    icon: '✅',
    step: 2,
  },
  finance_approved: {
    label: 'اعتمد المالي',
    labelEn: 'Finance Approved',
    color: '#5B21B6',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    icon: '💜',
    step: 3,
  },
  released: {
    label: 'مُصدَر',
    labelEn: 'Released',
    color: '#065F46',
    bg: '#ECFDF5',
    border: '#6EE7B7',
    icon: '🚀',
    step: 4,
  },
  rejected: {
    label: 'مرفوض',
    labelEn: 'Rejected',
    color: '#991B1B',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    icon: '❌',
    step: 0,
  },
};

// ── Arabic month names ────────────────────────────────────────────────────────
const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ── Progress stepper ──────────────────────────────────────────────────────────
function ApprovalStepper({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const steps = [
    { label: 'مسودة', step: 1 },
    { label: 'المشرف', step: 2 },
    { label: 'المالي', step: 3 },
    { label: 'مُصدَر', step: 4 },
  ];

  if (status === 'rejected') {
    return (
      <div className="stepper-rejected">
        <span>❌</span>
        <span>مرفوض</span>
      </div>
    );
  }

  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s.step} className="stepper-item">
          <div
            className={`stepper-dot ${cfg.step >= s.step ? 'active' : ''} ${cfg.step === s.step ? 'current' : ''}`}
          >
            {cfg.step > s.step ? '✓' : s.step}
          </div>
          <span className={`stepper-label ${cfg.step >= s.step ? 'active-lbl' : ''}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`stepper-line ${cfg.step > s.step ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Single disbursement card ──────────────────────────────────────────────────
function DisbursementCard({ list }) {
  const cfg = STATUS_CONFIG[list.status] || STATUS_CONFIG.draft;
  const monthName = ARABIC_MONTHS[list.month] || list.month;
  const totalAmount = parseFloat(list.total_amount || 0).toLocaleString('ar-YE', {
    minimumFractionDigits: 0,
  });
  const totalItems = parseInt(list.total_items || 0);

  const createdAt = new Date(list.created_at).toLocaleDateString('ar-YE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Link href={`/disbursements/${list.id}`} className="card-link">
      <div className="disb-card" style={{ '--border-color': cfg.border }}>
        {/* Header */}
        <div className="card-header">
          <div className="card-period">
            <span className="period-icon">📅</span>
            <div>
              <span className="period-month">{monthName}</span>
              <span className="period-year">{list.year}</span>
            </div>
          </div>

          <span
            className="status-badge"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
          >
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Stepper */}
        <ApprovalStepper status={list.status} />

        {/* Stats row */}
        <div className="card-stats">
          <div className="stat-item">
            <span className="stat-num">{totalItems}</span>
            <span className="stat-lbl">مستفيد</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{totalAmount}</span>
            <span className="stat-lbl">ريال إجمالي</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{list.created_by_name || '—'}</span>
            <span className="stat-lbl">أنشأه</span>
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer">
          <span className="card-date">{createdAt}</span>
          <span className="card-arrow">← عرض التفاصيل</span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-row">
        <div className="sk sk-lg" />
        <div className="sk sk-sm" />
      </div>
      <div className="sk sk-stepper" />
      <div className="sk-row mt">
        <div className="sk sk-med" />
        <div className="sk sk-med" />
        <div className="sk sk-med" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DisbursementsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/disbursements')
      .then(({ data }) => setLists(data.lists || []))
      .catch(() => setError('تعذّر تحميل كشوف الصرف'))
      .finally(() => setLoading(false));
  }, []);

  // Summary counts
  const summary = lists.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Page header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">كشوف الصرف الشهري</h1>
            <p className="page-sub">إدارة دورات الصرف من التوليد حتى الإصدار النهائي</p>
          </div>
        </div>

        {/* Summary chips */}
        {!loading && lists.length > 0 && (
          <div className="summary-row">
            {Object.entries(summary).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              if (!cfg) return null;
              return (
                <div
                  key={status}
                  className="summary-chip"
                  style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                >
                  {cfg.icon} {count} {cfg.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="err-banner">⚠ {error}</div>
        )}

        {/* Grid */}
        <div className="cards-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : lists.length === 0
            ? (
              <div className="empty-state">
                <span className="empty-ico">💰</span>
                <p>لا توجد كشوف صرف بعد</p>
                <p className="empty-sub">سيظهر هنا الكشف بعد توليده من لوحة التحكم</p>
              </div>
            )
            : lists.map((list) => (
              <DisbursementCard key={list.id} list={list} />
            ))
          }
        </div>

      </div>

      <style jsx>{`
        .page { max-width: 1000px; margin: 0 auto; padding-bottom: 4rem; font-family: 'Cairo','Tajawal',sans-serif; }
        .page-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .25rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        .summary-row { display: flex; gap: .6rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .summary-chip { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .85rem; border-radius: 999px; font-size: .78rem; font-weight: 700; border: 1px solid; }

        .err-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem; margin-bottom: 1rem; }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.25rem; }
        @media (max-width: 640px) { .cards-grid { grid-template-columns: 1fr; } }

        /* Disbursement card */
        .card-link { text-decoration: none; display: block; }
        .disb-card {
          background: #fff;
          border: 1.5px solid var(--border-color, #e5eaf0);
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: transform .15s, box-shadow .15s;
          cursor: pointer;
        }
        .disb-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(27,94,140,.1); }

        .card-header { display: flex; align-items: center; justify-content: space-between; }
        .card-period { display: flex; align-items: center; gap: .6rem; }
        .period-icon { font-size: 1.4rem; }
        .period-month { display: block; font-size: 1.1rem; font-weight: 800; color: #0d3d5c; line-height: 1; }
        .period-year { display: block; font-size: .8rem; color: #6b7280; margin-top: .1rem; }

        .status-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .75rem; border-radius: 999px; font-size: .75rem; font-weight: 700; border: 1px solid; }

        /* Stepper */
        .stepper { display: flex; align-items: center; gap: 0; background: #f9fafb; border-radius: .625rem; padding: .6rem .8rem; }
        .stepper-item { display: flex; align-items: center; flex: 1; }
        .stepper-dot {
          width: 22px; height: 22px; border-radius: 50%;
          background: #e5e7eb; color: #9ca3af;
          font-size: .65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all .2s;
        }
        .stepper-dot.active { background: #1B5E8C; color: #fff; }
        .stepper-dot.current { background: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.2); }
        .stepper-label { font-size: .65rem; color: #9ca3af; margin: 0 .3rem; white-space: nowrap; }
        .stepper-label.active-lbl { color: #1B5E8C; font-weight: 600; }
        .stepper-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 .2rem; }
        .stepper-line.done { background: #1B5E8C; }
        .stepper-rejected { display: flex; align-items: center; gap: .5rem; font-size: .8rem; font-weight: 600; color: #dc2626; background: #fef2f2; border-radius: .5rem; padding: .5rem .75rem; }

        /* Stats */
        .card-stats { display: flex; align-items: center; gap: .75rem; }
        .stat-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .stat-num { font-size: 1rem; font-weight: 700; color: #0d3d5c; }
        .stat-lbl { font-size: .68rem; color: #9ca3af; }
        .stat-divider { width: 1px; height: 2rem; background: #e5e7eb; }

        /* Footer */
        .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: .6rem; border-top: 1px solid #f3f4f6; }
        .card-date { font-size: .72rem; color: #9ca3af; }
        .card-arrow { font-size: .75rem; font-weight: 600; color: #1B5E8C; }

        /* Skeleton */
        .skeleton-card { background: #fff; border: 1.5px solid #e5eaf0; border-radius: 1rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .sk { border-radius: .4rem; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        .sk-row { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
        .mt { margin-top: .25rem; }
        .sk-lg { height: 2.5rem; width: 40%; }
        .sk-sm { height: 1.5rem; width: 25%; }
        .sk-stepper { height: 2.5rem; width: 100%; }
        .sk-med { height: 1.5rem; flex: 1; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Empty */
        .empty-state { grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #9ca3af; }
        .empty-ico { font-size: 3rem; display: block; margin-bottom: .75rem; }
        .empty-sub { font-size: .82rem; margin-top: .25rem; }
      `}</style>
    </AppShell>
  );
}
