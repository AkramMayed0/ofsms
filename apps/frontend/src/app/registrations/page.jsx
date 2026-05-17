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
import { AlertTriangle, X, User, Users, Check, RefreshCw, MapPin, CalendarDays, UserCircle, Users2, CheckCircle2 } from 'lucide-react';

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
          <span className="modal-icon"><AlertTriangle size={18} /></span>
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
            {loading ? <span className="spin" /> : <><X size={16} /> تأكيد الرفض</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailPanel({ record, onApprove, onReject, actionLoading, onClose }) {
  const isOrphan = record.record_type === 'orphan';

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-box" onClick={(e) => e.stopPropagation()}>

        {/* ── Gradient header ── */}
        <div className={`dp-header ${isOrphan ? 'dp-header-orphan' : 'dp-header-family'}`}>
          <div className="dp-avatar">
            {isOrphan ? <User size={22} /> : <Users size={22} />}
          </div>
          <div className="dp-title-wrap">
            <h2 className="dp-name">{record.name}</h2>
            <span className={`dp-chip ${isOrphan ? 'dp-chip-orphan' : 'dp-chip-family'}`}>
              {isOrphan ? 'يتيم' : 'أسرة'}
            </span>
          </div>
          <button className="dp-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        {/* ── Info grid ── */}
        <div className="dp-body">
          <div className="dp-grid">
            <div className="dp-info-card">
              <MapPin size={14} className="dp-info-icon" />
              <div>
                <span className="dp-info-label">المحافظة</span>
                <span className="dp-info-val">{record.governorate_ar || '—'}</span>
              </div>
            </div>
            <div className="dp-info-card">
              <UserCircle size={14} className="dp-info-icon" />
              <div>
                <span className="dp-info-label">المندوب</span>
                <span className="dp-info-val">{record.agent_name || '—'}</span>
              </div>
            </div>
            <div className="dp-info-card">
              <CalendarDays size={14} className="dp-info-icon" />
              <div>
                <span className="dp-info-label">تاريخ التسجيل</span>
                <span className="dp-info-val">{fmtDate(record.created_at)}</span>
              </div>
            </div>
            {isOrphan && record.date_of_birth && (
              <div className="dp-info-card">
                <CalendarDays size={14} className="dp-info-icon" />
                <div>
                  <span className="dp-info-label">العمر</span>
                  <span className="dp-info-val">{calcAge(record.date_of_birth)} سنة</span>
                </div>
              </div>
            )}
            {isOrphan && record.gender && (
              <div className="dp-info-card">
                <User size={14} className="dp-info-icon" />
                <div>
                  <span className="dp-info-label">الجنس</span>
                  <span className="dp-info-val">{record.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                </div>
              </div>
            )}
            {record.guardian_name && (
              <div className="dp-info-card">
                <UserCircle size={14} className="dp-info-icon" />
                <div>
                  <span className="dp-info-label">{isOrphan ? 'الوصي' : 'رب الأسرة'}</span>
                  <span className="dp-info-val">{record.guardian_name}</span>
                </div>
              </div>
            )}
            {isOrphan && record.guardian_relation && (
              <div className="dp-info-card">
                <Users2 size={14} className="dp-info-icon" />
                <div>
                  <span className="dp-info-label">صلة الوصي</span>
                  <span className="dp-info-val">
                    {GUARDIAN_LABELS[record.guardian_relation] || record.guardian_relation}
                  </span>
                </div>
              </div>
            )}
            {!isOrphan && record.member_count && (
              <div className="dp-info-card">
                <Users size={14} className="dp-info-icon" />
                <div>
                  <span className="dp-info-label">عدد الأفراد</span>
                  <span className="dp-info-val">{record.member_count}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="dp-section">
              <p className="dp-section-title">ملاحظات المندوب</p>
              <p className="dp-notes">{record.notes}</p>
            </div>
          )}

          {/* Documents link */}
          <a
            href={`/${isOrphan ? 'orphans' : 'families'}/${record.id}`}
            className="dp-docs-link"
            target="_blank"
            rel="noreferrer"
          >
            عرض الملف الكامل والمستندات ←
          </a>
        </div>

        {/* ── Actions ── */}
        <div className="dp-actions">
          <button className="dp-btn-approve" onClick={onApprove} disabled={!!actionLoading}>
            {actionLoading === 'approve'
              ? <><span className="spin spin-sm" /> جارٍ الاعتماد…</>
              : <><Check size={16} /> اعتماد التسجيل</>}
          </button>
          <button className="dp-btn-reject" onClick={onReject} disabled={!!actionLoading}>
            <X size={15} /> رفض
          </button>
        </div>

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
      showToast(`تمت الموافقة على ${record.name} وانتقل إلى التسويق`);
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
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Stat pills ── */}
        <div className="stat-pills">
          {[
            { label: 'إجمالي الطلبات', count: queue.length,  color: '#1B5E8C' },
            { label: 'أيتام',           count: orphanCount,   color: '#F59E0B' },
            { label: 'أسر',             count: familyCount,   color: '#10B981' },
          ].map((p) => (
            <div key={p.label} className="stat-pill">
              <span className="stat-pill-count" style={{ color: p.color }}>{loading ? '…' : p.count}</span>
              <span className="stat-pill-label">{p.label}</span>
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && <div className="err-banner"><AlertTriangle size={18} /> {error}</div>}

        {/* ── Queue list (full width) ── */}
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
                  <span className="empty-icon"><CheckCircle2 size={40} strokeWidth={1.5} /></span>
                  <p className="empty-title">لا توجد طلبات معلّقة</p>
                  <p className="empty-sub">كل الطلبات تمت مراجعتها</p>
                </div>
              )
              : displayed.map((record) => {
                  const isOrphan = record.record_type === 'orphan';
                  return (
                    <div
                      key={record.id}
                      className="queue-row"
                      onClick={() => setSelected(record)}
                    >
                      {/* Type badge */}
                      <div className={`row-badge ${isOrphan ? 'badge-orphan' : 'badge-family'}`}>
                        {isOrphan ? <User size={18} /> : <Users size={18} />}
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

        {/* ── Detail modal ── */}
        {selected && (
          <DetailPanel
            record={selected}
            onApprove={() => handleApprove(selected)}
            onReject={() => setRejectTarget(selected)}
            actionLoading={actionLoading}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          padding-bottom: 3rem;
          position: relative;
        }
        @media (max-width: 600px) {
          .page { gap: 0.75rem; }
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
          flex-wrap: wrap;
        }
        .page-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0 0 0.2rem;
        }
        .page-sub { font-size: 0.82rem; color: #9ca3af; margin: 0; }
        .btn-refresh {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.625rem;
          background: #fff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        /* ── Stat pills ──────────────────────────────────────────────── */
        .stat-pills { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .stat-pill {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 0.6rem 1.1rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          min-width: 80px;
          flex: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .stat-pill-count { font-size: 1.35rem; font-weight: 800; line-height: 1; }
        .stat-pill-label { font-size: 0.72rem; font-weight: 600; color: #6b7280; white-space: nowrap; }
        @media (max-width: 400px) {
          .stat-pill-count { font-size: 1.1rem; }
          .stat-pill { padding: 0.5rem 0.75rem; min-width: 60px; }
        }

        /* ── Error ───────────────────────────────────────────────────── */
        .err-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
        }

        /* ── Queue list col ────────────────────────────────────────────── */
        .queue-col {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }

        /* ── Filter tabs ──────────────────────────────────────────────── */
        .filter-tabs {
          display: flex;
          border-bottom: 1.5px solid #e5eaf0;
          padding: 0.5rem 1rem 0;
          gap: 0.25rem;
          background: #f8fafc;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filter-tabs::-webkit-scrollbar { display: none; }
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
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tab:hover { color: #1B5E8C; }
        .tab-active { color: #1B5E8C; border-bottom-color: #1B5E8C; }
        .tab-count {
          background: #e5eaf0;
          color: #6b7280;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0 0.4rem;
          border-radius: 999px;
          min-width: 1.2rem;
          text-align: center;
        }
        .tab-count-active { background: #EFF6FF; color: #1B5E8C; }

        /* ── Queue list ───────────────────────────────────────────────── */
        .queue-list {
          max-height: calc(100vh - 240px);
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
        .queue-row:hover { background: #f8fbff; }
        @media (max-width: 480px) {
          .queue-row { padding: 0.75rem 1rem; gap: 0.65rem; }
          .row-date { display: none; }
        }

        .row-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #1B5E8C;
        }
        .badge-orphan { background: #EFF6FF; color: #1B5E8C; }
        .badge-family { background: #ECFDF5; color: #059669; }

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

        /* ── Empty state ──────────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 4rem 1rem;
          text-align: center;
        }
        .empty-icon  { color: #10B981; display: flex; }
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



      `}</style>

      {/* ── Global styles for the detail popup ── */}
      <style jsx global>{`
        .dp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13,61,92,0.45);
          backdrop-filter: blur(4px);
          z-index: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: dpFadeIn 0.18s ease;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          direction: rtl;
        }
        @media (max-width: 480px) {
          .dp-overlay { padding: 0; align-items: flex-end; }
          .dp-box {
            max-width: 100% !important;
            max-height: 92vh !important;
            border-radius: 1.25rem 1.25rem 0 0 !important;
            animation: dpSlideUpMobile 0.25s cubic-bezier(.22,1,.36,1) !important;
          }
          .dp-grid { grid-template-columns: 1fr !important; }
          .dp-header { padding: 1rem 1.25rem !important; }
          .dp-body { padding: 1rem 1.25rem !important; }
          .dp-actions { padding: 0.875rem 1.25rem !important; }
          .modal-overlay { padding: 0; align-items: flex-end; }
          .modal-box {
            max-width: 100% !important;
            border-radius: 1.25rem 1.25rem 0 0 !important;
            animation: dpSlideUpMobile 0.25s cubic-bezier(.22,1,.36,1) !important;
          }
        }
        @keyframes dpFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes dpSlideUpMobile {
          from { transform: translateY(100%); }
          to   { transform: none; }
        }
        .dp-box {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 1.25rem;
          width: 100%;
          max-width: 500px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(13,61,92,0.22);
          overflow: hidden;
          animation: dpSlideUp 0.22s cubic-bezier(.22,1,.36,1);
        }
        @keyframes dpSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:none; }
        }
        .dp-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1.25rem 1.5rem;
          color: #fff;
          flex-shrink: 0;
        }
        .dp-header-orphan { background: linear-gradient(135deg, #0d3d5c 0%, #1B5E8C 100%); }
        .dp-header-family  { background: linear-gradient(135deg, #065f46 0%, #059669 100%); }
        .dp-avatar {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dp-title-wrap { flex: 1; min-width: 0; }
        .dp-name {
          font-size: 1.1rem; font-weight: 800; color: #fff;
          margin: 0 0 0.2rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dp-chip {
          display: inline-block;
          font-size: 0.68rem; font-weight: 700;
          padding: 0.1rem 0.55rem;
          border-radius: 999px;
        }
        .dp-chip-orphan { background: rgba(255,255,255,0.2); color: #bfdbfe; }
        .dp-chip-family  { background: rgba(255,255,255,0.2); color: #a7f3d0; }
        .dp-close {
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.15);
          border: none; border-radius: 8px;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.12s;
        }
        .dp-close:hover { background: rgba(255,255,255,0.28); }
        .dp-body {
          flex: 1; overflow-y: auto; min-height: 0;
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .dp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .dp-info-card {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #e5eaf0;
          border-radius: 0.75rem;
          padding: 0.65rem 0.75rem;
        }
        .dp-info-icon { color: #1B5E8C; margin-top: 3px; flex-shrink: 0; }
        .dp-info-label {
          display: block;
          font-size: 0.68rem; font-weight: 700;
          color: #9ca3af; margin-bottom: 2px;
        }
        .dp-info-val {
          display: block;
          font-size: 0.83rem; font-weight: 600; color: #1f2937;
        }
        .dp-section {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
        }
        .dp-section-title {
          font-size: 0.7rem; font-weight: 800;
          color: #92400e; letter-spacing: 0.05em;
          margin: 0 0 0.4rem;
        }
        .dp-notes { font-size: 0.85rem; color: #374151; line-height: 1.7; margin: 0; }
        .dp-docs-link {
          display: inline-flex; align-items: center;
          font-size: 0.8rem; font-weight: 700;
          color: #1B5E8C; text-decoration: none;
          padding: 0.5rem 0.75rem;
          border: 1.5px solid #bfdbfe;
          border-radius: 0.625rem;
          background: #EFF6FF;
          transition: all 0.15s; align-self: flex-start;
        }
        .dp-docs-link:hover { background: #dbeafe; border-color: #93c5fd; }
        .dp-actions {
          display: flex; gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1.5px solid #e5eaf0;
          background: #fff; flex-shrink: 0;
        }
        .dp-btn-approve {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.8rem;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          font-family: 'Cairo', sans-serif; font-size: 0.9rem; font-weight: 700;
          border: none; border-radius: 0.75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(5,150,105,.25);
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .dp-btn-approve:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(5,150,105,.35);
        }
        .dp-btn-approve:disabled { opacity: 0.55; cursor: not-allowed; }
        .dp-btn-reject {
          display: flex; align-items: center; justify-content: center; gap: 0.35rem;
          padding: 0.8rem 1.25rem;
          background: #fff;
          border: 1.5px solid #fca5a5; color: #DC2626;
          font-family: 'Cairo', sans-serif; font-size: 0.88rem; font-weight: 700;
          border-radius: 0.75rem; cursor: pointer;
          transition: all 0.15s;
        }
        .dp-btn-reject:hover:not(:disabled) { background: #fef2f2; border-color: #f87171; }
        .dp-btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 360px) {
          .dp-btn-approve, .dp-btn-reject { font-size: 0.8rem; padding: 0.7rem 0.5rem; }
        }
        .spin-sm {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff; border-radius: 50%;
          animation: dpSpin .6s linear infinite;
        }
        @keyframes dpSpin { to { transform: rotate(360deg); } }

        /* ── Reject modal ────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          font-family: 'Cairo','Tajawal',sans-serif;
          direction: rtl;
          animation: dpFadeIn 0.15s ease;
        }
        .modal-box {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 1rem;
          width: 100%; max-width: 440px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          overflow: hidden;
          animation: dpSlideUp 0.2s ease;
        }
        .modal-header {
          display: flex; align-items: flex-start; gap: 0.875rem;
          padding: 1.25rem 1.5rem;
          background: #FEF2F2; border-bottom: 1px solid #fecaca;
        }
        .modal-icon { color: #DC2626; flex-shrink: 0; margin-top: 2px; }
        .modal-title { font-size: 1rem; font-weight: 800; color: #b91c1c; margin: 0 0 0.15rem; }
        .modal-sub { font-size: 0.8rem; color: #6b7280; margin: 0; }
        .modal-body { padding: 1.25rem 1.5rem; }
        .modal-label { display: block; font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
        .req { color: #DC2626; }
        .modal-textarea {
          width: 100%;
          border: 1.5px solid #e5eaf0; border-radius: 0.75rem;
          padding: 0.7rem 0.9rem;
          font-size: 0.88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          resize: vertical; outline: none; box-sizing: border-box;
          background: #fafafa;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .modal-textarea:focus { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,.08); background: #fff; }
        .modal-hint { font-size: 0.75rem; color: #9ca3af; margin: 0.5rem 0 0; }
        .modal-actions { display: flex; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e5eaf0; }
        .btn-ghost {
          flex: 1; padding: 0.7rem;
          background: none; border: 1.5px solid #e5eaf0; border-radius: 0.75rem;
          font-family: 'Cairo', sans-serif; font-size: 0.85rem; font-weight: 600;
          color: #6b7280; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost:hover:not(:disabled) { border-color: #9ca3af; color: #374151; }
        .btn-reject {
          flex: 2; padding: 0.7rem;
          background: linear-gradient(135deg, #DC2626, #b91c1c);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: 0.88rem; font-weight: 700;
          border: none; border-radius: 0.75rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          transition: transform 0.12s, box-shadow 0.12s;
          box-shadow: 0 2px 8px rgba(220,38,38,.25);
        }
        .btn-reject:hover:not(.btn-disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(220,38,38,.35); }
        .btn-disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Spinners ────────────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff; border-radius: 50%;
          animation: dpSpin .6s linear infinite; flex-shrink: 0;
        }
        .spin-dark { border-color: rgba(5,150,105,.3); border-top-color: #047857; }
      `}</style>
    </AppShell>
  );
}
