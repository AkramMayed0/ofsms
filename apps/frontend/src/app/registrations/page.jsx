'use client';

/**
 * page.jsx
 * Route:  /registrations  (Supervisor + GM)
 * API:    GET  /api/supervisor/queue          → merged pending orphans + families
 *         PATCH /api/orphans/:id/status       → approve / reject orphan
 *         PATCH /api/families/:id/status      → approve / reject family
 *
 * Layout:
 *   Left  — filterable queue list
 *   Right — slide-in detail panel (opens on row click)
 *           with Approve / Reject (+ notes modal) actions
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Constants ─────────────────────────────────────────────────────────────────
const GUARDIAN_LABELS = {
  uncle: 'عم', maternal_uncle: 'خال', grandfather: 'جد',
  sibling: 'أخ / أخت', other: 'أخرى',
};

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateRelative = (d) => {
  if (!d) return '—';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff < 7)  return `منذ ${diff} أيام`;
  return fmtDate(d);
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="queue-row sk-row">
      <div className="sk-badge" />
      <div className="sk-lines">
        <div className="sk-line" style={{ width: 160 }} />
        <div className="sk-line" style={{ width: 100 }} />
      </div>
      <div className="sk-line" style={{ width: 70 }} />
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ record, onConfirm, onCancel, loading }) {
  const [notes, setNotes] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">⚠</span>
          <div>
            <h3 className="modal-title">رفض التسجيل</h3>
            <p className="modal-sub">
              {record.record_type === 'orphan' ? record.name : record.name}
            </p>
          </div>
        </div>
        <div className="modal-body">
          <label className="modal-label">سبب الرفض <span className="req">*</span></label>
          <textarea
            className="modal-textarea"
            rows={4}
            placeholder="اكتب سبب الرفض ليُرسَل للمندوب عبر الإشعارات…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
          />
          <p className="modal-hint">
            سيتلقى المندوب إشعاراً فورياً يتضمن هذا السبب.
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            إلغاء
          </button>
          <button
            className={`btn-reject ${!notes.trim() || loading ? 'btn-disabled' : ''}`}
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={!notes.trim() || loading}
          >
            {loading ? <span className="spin" /> : '✕ تأكيد الرفض'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ record, onApprove, onReject, actionLoading, onClose }) {
  const isOrphan = record.record_type === 'orphan';

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-avatar">
          {isOrphan ? '👦' : '👨‍👩‍👧'}
        </div>
        <div className="detail-title-wrap">
          <h2 className="detail-name">{record.name}</h2>
          <span className={`type-chip ${isOrphan ? 'type-orphan' : 'type-family'}`}>
            {isOrphan ? 'يتيم' : 'أسرة'}
          </span>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="إغلاق">✕</button>
      </div>

      {/* Body */}
      <div className="detail-body">

        {/* Info section */}
        <div className="detail-section">
          <h3 className="detail-section-title">بيانات التسجيل</h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">المحافظة</span>
              <span className="detail-val">{record.governorate_ar || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">المندوب</span>
              <span className="detail-val">{record.agent_name || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">تاريخ التسجيل</span>
              <span className="detail-val">{fmtDate(record.created_at)}</span>
            </div>
            {isOrphan && record.date_of_birth && (
              <div className="detail-row">
                <span className="detail-label">العمر</span>
                <span className="detail-val">{calcAge(record.date_of_birth)} سنة</span>
              </div>
            )}
            {isOrphan && record.gender && (
              <div className="detail-row">
                <span className="detail-label">الجنس</span>
                <span className="detail-val">{record.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
              </div>
            )}
            {record.guardian_name && (
              <div className="detail-row">
                <span className="detail-label">{isOrphan ? 'الوصي' : 'رب الأسرة'}</span>
                <span className="detail-val">{record.guardian_name}</span>
              </div>
            )}
            {isOrphan && record.guardian_relation && (
              <div className="detail-row">
                <span className="detail-label">صلة الوصي</span>
                <span className="detail-val">
                  {GUARDIAN_LABELS[record.guardian_relation] || record.guardian_relation}
                </span>
              </div>
            )}
            {!isOrphan && record.member_count && (
              <div className="detail-row">
                <span className="detail-label">عدد الأفراد</span>
                <span className="detail-val">{record.member_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {record.notes && (
          <div className="detail-section">
            <h3 className="detail-section-title">ملاحظات المندوب</h3>
            <p className="detail-notes">{record.notes}</p>
          </div>
        )}

        {/* Documents placeholder */}
        <div className="detail-section">
          <h3 className="detail-section-title">المستندات</h3>
          <p className="docs-hint">
            لعرض المستندات المرفوعة، افتح الملف الكامل من
            {' '}
            <a
              href={`/${isOrphan ? 'orphans' : 'families'}/${record.id}`}
              className="docs-link"
              target="_blank"
              rel="noreferrer"
            >
              صفحة التفاصيل ←
            </a>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="detail-actions">
        <button
          className="btn-approve"
          onClick={onApprove}
          disabled={actionLoading}
        >
          {actionLoading === 'approve'
            ? <><span className="spin spin-dark" /> جارٍ الاعتماد…</>
            : '✓ اعتماد التسجيل'}
        </button>
        <button
          className="btn-reject-outline"
          onClick={onReject}
          disabled={!!actionLoading}
        >
          ✕ رفض
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RegistrationsPage() {
  const [queue, setQueue]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('all');   // all | orphan | family
  const [selected, setSelected]       = useState(null);    // the record in detail panel
  const [rejectTarget, setRejectTarget] = useState(null);  // record for reject modal
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null
  const [toast, setToast]             = useState(null);    // { msg, type }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQueue = useCallback(() => {
    setLoading(true);
    api.get('/supervisor/queue')
      .then((res) => setQueue(res.data.queue || []))
      .catch(() => setError('تعذّر تحميل قائمة الانتظار.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const displayed = filter === 'all'
    ? queue
    : queue.filter((r) => r.record_type === filter);

  // ── Approve ──
  const handleApprove = async (record) => {
    setActionLoading('approve');
    const endpoint = record.record_type === 'orphan'
      ? `/orphans/${record.id}/status`
      : `/families/${record.id}/status`;
    try {
      await api.patch(endpoint, { status: 'under_marketing' });
      setQueue((prev) => prev.filter((r) => r.id !== record.id));
      setSelected(null);
      showToast(`✓ تمت الموافقة على ${record.name} وانتقل إلى التسويق`);
    } catch {
      showToast('فشل الاعتماد. يرجى المحاولة مجدداً.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ──
  const handleRejectConfirm = async (notes) => {
    if (!rejectTarget) return;
    setActionLoading('reject');
    const endpoint = rejectTarget.record_type === 'orphan'
      ? `/orphans/${rejectTarget.id}/status`
      : `/families/${rejectTarget.id}/status`;
    try {
      await api.patch(endpoint, { status: 'rejected', notes });
      setQueue((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      if (selected?.id === rejectTarget.id) setSelected(null);
      setRejectTarget(null);
      showToast(`تم رفض تسجيل ${rejectTarget.name} وإشعار المندوب`);
    } catch {
      showToast('فشل الرفض. يرجى المحاولة مجدداً.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Counts
  const orphanCount = queue.filter((r) => r.record_type === 'orphan').length;
  const familyCount = queue.filter((r) => r.record_type === 'family').length;

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* ── Toast ── */}
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-err' : 'toast-ok'}`}>
            {toast.msg}
          </div>
        )}

        {/* ── Reject modal ── */}
        {rejectTarget && (
          <RejectModal
            record={rejectTarget}
            onConfirm={handleRejectConfirm}
            onCancel={() => setRejectTarget(null)}
            loading={actionLoading === 'reject'}
          />
        )}

        {/* ── Page header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">طلبات التسجيل</h1>
            <p className="page-sub">
              {loading ? '…' : `${queue.length} طلب بانتظار المراجعة`}
            </p>
          </div>
          <button className="btn-refresh" onClick={fetchQueue} title="تحديث">
            ↻ تحديث
          </button>
        </div>

        {/* ── Error ── */}
        {error && <div className="err-banner">⚠ {error}</div>}

        {/* ── Main split layout ── */}
        <div className={`split ${selected ? 'split-open' : ''}`}>

          {/* ── Queue list ── */}
          <div className="queue-col">

            {/* Filter tabs */}
            <div className="filter-tabs">
              {[
                { value: 'all',    label: 'الكل',    count: queue.length },
                { value: 'orphan', label: 'أيتام',   count: orphanCount },
                { value: 'family', label: 'أسر',     count: familyCount },
              ].map((f) => (
                <button
                  key={f.value}
                  className={`tab ${filter === f.value ? 'tab-active' : ''}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                  {!loading && (
                    <span className={`tab-count ${filter === f.value ? 'tab-count-active' : ''}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Queue rows */}
            <div className="queue-list">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : displayed.length === 0
                ? (
                  <div className="empty-state">
                    <span className="empty-icon">🎉</span>
                    <p className="empty-title">لا توجد طلبات معلّقة</p>
                    <p className="empty-sub">كل الطلبات تمت مراجعتها</p>
                  </div>
                )
                : displayed.map((record) => {
                    const isSelected = selected?.id === record.id;
                    const isOrphan   = record.record_type === 'orphan';
                    return (
                      <div
                        key={record.id}
                        className={`queue-row ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => setSelected(isSelected ? null : record)}
                      >
                        {/* Type badge */}
                        <div className={`row-badge ${isOrphan ? 'badge-orphan' : 'badge-family'}`}>
                          {isOrphan ? '👦' : '👨‍👩‍👧'}
                        </div>

                        {/* Info */}
                        <div className="row-info">
                          <span className="row-name">{record.name}</span>
                          <span className="row-meta">
                            {record.governorate_ar}
                            {record.agent_name && ` · ${record.agent_name}`}
                          </span>
                        </div>

                        {/* Date + arrow */}
                        <div className="row-right">
                          <span className="row-date">{fmtDateRelative(record.created_at)}</span>
                          <span className="row-arrow">←</span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <div className="detail-col">
              <DetailPanel
                record={selected}
                onApprove={() => handleApprove(selected)}
                onReject={() => setRejectTarget(selected)}
                actionLoading={actionLoading}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          padding-bottom: 3rem;
          position: relative;
        }

        /* ── Toast ───────────────────────────────────────────────────── */
        .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          z-index: 100;
          animation: toastIn 0.25s ease;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .toast-ok  { background: #0d3d5c; color: #fff; }
        .toast-err { background: #DC2626; color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Header ──────────────────────────────────────────────────── */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .page-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0 0 0.2rem;
        }
        .page-sub { font-size: 0.83rem; color: #9ca3af; margin: 0; }
        .btn-refresh {
          padding: 0.55rem 1rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.625rem;
          background: #fff;
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; }

        /* ── Error ───────────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
        }

        /* ── Split layout ─────────────────────────────────────────────── */
        .split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          align-items: start;
          transition: grid-template-columns 0.3s ease;
        }
        .split-open {
          grid-template-columns: 1fr 380px;
        }
        @media (max-width: 900px) {
          .split-open { grid-template-columns: 1fr; }
          .detail-col { position: fixed; inset: 0; z-index: 50; background: #fff; overflow-y: auto; }
        }

        /* ── Queue list col ────────────────────────────────────────────── */
        .queue-col {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
        }

        /* ── Filter tabs ──────────────────────────────────────────────── */
        .filter-tabs {
          display: flex;
          border-bottom: 1.5px solid #f3f4f6;
          padding: 0.5rem 1rem 0;
          gap: 0.25rem;
          background: #fafafa;
        }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border: none;
          background: none;
          font-family: 'Cairo', sans-serif;
          font-size: 0.83rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: all 0.15s;
          margin-bottom: -1.5px;
        }
        .tab:hover { color: #1B5E8C; }
        .tab-active { color: #1B5E8C; border-bottom-color: #1B5E8C; }
        .tab-count {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0 0.4rem;
          border-radius: 999px;
          min-width: 1.2rem;
          text-align: center;
        }
        .tab-count-active { background: #dbeafe; color: #1d4ed8; }

        /* ── Queue list ───────────────────────────────────────────────── */
        .queue-list {
          max-height: calc(100vh - 260px);
          overflow-y: auto;
        }
        .queue-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid #f9fafb;
          cursor: pointer;
          transition: background 0.12s;
        }
        .queue-row:last-child { border-bottom: none; }
        .queue-row:hover { background: #f0f7ff; }
        .row-selected { background: #EFF6FF !important; border-right: 3px solid #1B5E8C; }

        .row-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .badge-orphan { background: #EFF6FF; }
        .badge-family { background: #F0FDF4; }

        .row-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .row-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .row-meta {
          font-size: 0.75rem;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          flex-shrink: 0;
        }
        .row-date  { font-size: 0.72rem; color: #9ca3af; white-space: nowrap; }
        .row-arrow {
          font-size: 0.75rem;
          color: #d1d5db;
          transition: color 0.12s, transform 0.12s;
        }
        .queue-row:hover .row-arrow { color: #1B5E8C; transform: translateX(-3px); }
        .row-selected .row-arrow    { color: #1B5E8C; }

        /* ── Empty state ──────────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 4rem 1rem;
          text-align: center;
        }
        .empty-icon  { font-size: 2.5rem; }
        .empty-title { font-size: 0.9rem; color: #374151; font-weight: 700; margin: 0; }
        .empty-sub   { font-size: 0.8rem; color: #9ca3af; margin: 0; }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .sk-row { pointer-events: none; }
        .sk-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .sk-badge, .sk-line, .sk-lines {
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; background: none; }
        .sk-line {
          height: 12px;
          border-radius: 6px;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Detail panel col ─────────────────────────────────────────── */
        .detail-col {
          position: sticky;
          top: 1rem;
        }
        .detail-panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: panelIn 0.2s ease;
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: none; }
        }

        /* Detail header */
        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1.25rem 1.25rem 1rem;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          color: #fff;
        }
        .detail-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .detail-title-wrap { flex: 1; min-width: 0; }
        .detail-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .type-chip {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
        }
        .type-orphan { background: rgba(59,130,246,0.25); color: #93c5fd; }
        .type-family { background: rgba(52,211,153,0.25); color: #6ee7b7; }
        .detail-close {
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.12s;
        }
        .detail-close:hover { background: rgba(255,255,255,0.25); }

        /* Detail body */
        .detail-body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .detail-section {
          background: #fafafa;
          border: 1px solid #f3f4f6;
          border-radius: 0.75rem;
          padding: 0.875rem;
        }
        .detail-section-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #9ca3af;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }
        .detail-rows { display: flex; flex-direction: column; gap: 0.35rem; }
        .detail-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          padding: 0.3rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
          min-width: 90px;
          flex-shrink: 0;
        }
        .detail-val {
          font-size: 0.85rem;
          color: #1f2937;
          font-weight: 500;
        }
        .detail-notes {
          font-size: 0.83rem;
          color: #374151;
          line-height: 1.7;
          margin: 0;
        }
        .docs-hint {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
          line-height: 1.6;
        }
        .docs-link {
          color: #1B5E8C;
          font-weight: 600;
          text-decoration: none;
        }
        .docs-link:hover { text-decoration: underline; }

        /* Detail actions */
        .detail-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1.5px solid #f3f4f6;
          background: #fff;
        }
        .btn-approve {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          font-family: 'Cairo', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(5,150,105,.25);
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .btn-approve:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(5,150,105,.35);
        }
        .btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-reject-outline {
          padding: 0.75rem 1.1rem;
          background: #fff;
          border: 1.5px solid #fca5a5;
          color: #DC2626;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-reject-outline:hover:not(:disabled) { background: #fef2f2; }
        .btn-reject-outline:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Reject modal ─────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box {
          background: #fff;
          border-radius: 1.25rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:none; }
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1.25rem 1.5rem;
          background: #FEF2F2;
          border-bottom: 1px solid #fecaca;
        }
        .modal-icon { font-size: 1.4rem; flex-shrink: 0; }
        .modal-title {
          font-size: 1rem;
          font-weight: 800;
          color: #b91c1c;
          margin: 0 0 0.15rem;
        }
        .modal-sub { font-size: 0.8rem; color: #DC2626; margin: 0; }

        .modal-body { padding: 1.25rem 1.5rem; }
        .modal-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .req { color: #DC2626; }
        .modal-textarea {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          font-size: 0.88rem;
          font-family: 'Cairo', sans-serif;
          color: #1f2937;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .modal-textarea:focus {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,.1);
        }
        .modal-hint {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0.5rem 0 0;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .btn-ghost {
          flex: 1;
          padding: 0.7rem;
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost:hover:not(:disabled) { border-color: #9ca3af; color: #374151; }
        .btn-reject {
          flex: 2;
          padding: 0.7rem;
          background: linear-gradient(135deg, #DC2626, #b91c1c);
          color: #fff;
          font-family: 'Cairo', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: transform 0.12s, box-shadow 0.12s;
          box-shadow: 0 2px 8px rgba(220,38,38,.25);
        }
        .btn-reject:hover:not(.btn-disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(220,38,38,.35);
        }
        .btn-disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          flex-shrink: 0;
        }
        .spin-dark {
          border-color: rgba(5,150,105,.3);
          border-top-color: #047857;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
}
