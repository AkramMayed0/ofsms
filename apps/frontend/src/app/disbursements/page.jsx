'use client';

/**
 * [id]/page.jsx
 * Route: /disbursements/:id  (GM + Supervisor + Finance)
 *
 * CHANGES FROM ORIGINAL:
 * - Added Export PDF and Export Excel buttons in the actions bar
 * - downloadBlob uses '/reports/disbursement/:id?format=...' (no /api prefix)
 *   because api.baseURL already includes /api
 *
 * APIs:
 *   GET  /api/disbursements/:id
 *   GET  /api/reports/disbursement/:id?format=pdf|excel   ← NEW export
 *   PATCH /api/disbursements/:id/gm-release
 *   PATCH /api/disbursements/:id/supervisor-approve
 *   PATCH /api/disbursements/:id/supervisor-reject
 *   PATCH /api/disbursements/:id/finance-approve
 *   PATCH /api/disbursements/:id/finance-reject
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';

// ── Arabic months ─────────────────────────────────────────────────────────────
const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft:               { label: 'مسودة',        color: '#92400E', bg: '#FEF3C7', icon: '📝' },
  supervisor_approved: { label: 'اعتمد المشرف', color: '#1E40AF', bg: '#EFF6FF', icon: '✅' },
  finance_approved:    { label: 'اعتمد المالي', color: '#5B21B6', bg: '#F5F3FF', icon: '💜' },
  released:            { label: 'مُصدَر',        color: '#065F46', bg: '#ECFDF5', icon: '🚀' },
  rejected:            { label: 'مرفوض',         color: '#991B1B', bg: '#FEF2F2', icon: '❌' },
};

// ── Download helper (same fix as reports page) ────────────────────────────────
// api.baseURL = http://localhost:4000/api  →  paths must NOT include /api
const downloadBlob = async (path, filename) => {
  const response = await api.get(path, { responseType: 'blob' });
  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

// ── Confirmation modal ────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, variant = 'primary' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>إلغاء</button>
          <button
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><span className="spin" />جارٍ التنفيذ…</> : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ open, onConfirm, onCancel, loading }) {
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">سبب الرفض</h3>
        <p className="modal-msg">أدخل سبب رفض كشف الصرف — سيتلقى صاحب الكشف إشعاراً.</p>
        <textarea
          className="notes-inp"
          rows={3}
          placeholder="سبب الرفض…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>إلغاء</button>
          <button
            className="btn-danger"
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={loading || !notes.trim()}
          >
            {loading ? <><span className="spin" />جارٍ الرفض…</> : 'رفض الكشف'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Items table ───────────────────────────────────────────────────────────────
function ItemsTable({ items }) {
  if (!items?.length) return <p className="empty">لا توجد بنود في هذا الكشف</p>;
  const totalIncluded = items.filter(i => i.included).reduce((s, i) => s + parseFloat(i.amount), 0);
  const countIncluded = items.filter(i => i.included).length;
  return (
    <div className="table-section">
      <div className="table-meta">
        <span>{countIncluded} مستفيد مُدرَج</span>
        <span className="table-total">
          الإجمالي: <strong>{totalIncluded.toLocaleString('ar-YE')} ريال</strong>
        </span>
      </div>
      <div className="table-wrap">
        <table className="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المستفيد</th>
              <th>المحافظة</th>
              <th>الكافل</th>
              <th>المندوب</th>
              <th>المبلغ</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className={!item.included ? 'row-excluded' : ''}>
                <td className="td-num">{idx + 1}</td>
                <td className="td-name">{item.beneficiary_name || '—'}</td>
                <td>{item.governorate_ar || '—'}</td>
                <td>{item.sponsor_name || '—'}</td>
                <td>{item.agent_name || '—'}</td>
                <td className="td-amount">{parseFloat(item.amount).toLocaleString('ar-YE')}</td>
                <td>
                  {item.included
                    ? <span className="badge-included">مُدرَج</span>
                    : <span className="badge-excluded" title={item.exclusion_reason}>مُستثنى</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DisbursementDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const user    = useAuthStore(s => s.user);

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError,   setExportError]   = useState('');

  // Modals
  const [showRelease,    setShowRelease]    = useState(false);
  const [showSupApprove, setShowSupApprove] = useState(false);
  const [showFinApprove, setShowFinApprove] = useState(false);
  const [showSupReject,  setShowSupReject]  = useState(false);
  const [showFinReject,  setShowFinReject]  = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError('');
    setData(null);
    api.get(`/disbursements/${id}`)
      .then(axiosResponse => {
        const res = axiosResponse.data;
        if (res && res.id) {
          setData({ list: res, items: res.items || [] });
        } else {
          setError('تعذّر تحميل بيانات كشف الصرف');
        }
      })
      .catch(() => setError('تعذّر تحميل بيانات كشف الصرف'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const doAction = async (endpoint, body, successText) => {
    setActionLoading(true);
    setActionError('');
    setSuccessMsg('');
    try {
      await api.patch(`/disbursements/${id}/${endpoint}`, body || {});
      setSuccessMsg(successText);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'حدث خطأ أثناء التنفيذ');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExport = async (format) => {
    setExportLoading(true);
    setExportError('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const month    = ARABIC_MONTHS[list.month] || list.month;
      const filename = `disbursement-${list.year}-${list.month}-${date}.${ext}`;
      // ✅ Correct path — no /api prefix (api instance already has it in baseURL)
      await downloadBlob(`/reports/disbursement/${id}?format=${format}`, filename);
    } catch (err) {
      // Extract error from blob if needed
      let msg = 'فشل التصدير. يرجى المحاولة مجدداً.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          msg = JSON.parse(text).error || msg;
        } catch { /* ignore */ }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setExportError(msg);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell>
        <div className="loading-wrap">
          <div className="spinner-lg" />
          <p>جارٍ التحميل…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data || !data.list) {
    return (
      <AppShell>
        <div className="page" dir="rtl">
          <div className="err-banner">⚠ {error || 'الكشف غير موجود'}</div>
          <button className="btn-ghost mt" onClick={() => router.back()}>← رجوع</button>
        </div>
      </AppShell>
    );
  }

  const { list, items = [] } = data;
  const cfg         = STATUS_CONFIG[list.status] || STATUS_CONFIG.draft;
  const monthName   = ARABIC_MONTHS[list.month] || list.month;
  const totalAmount = items.reduce((s, i) => i.included ? s + parseFloat(i.amount) : s, 0);
  const role        = user?.role;
  const date        = new Date().toISOString().split('T')[0];

  const canSupApprove = (role === 'supervisor' || role === 'gm') && list.status === 'draft';
  const canSupReject  = (role === 'supervisor' || role === 'gm') && list.status === 'draft';
  const canFinApprove = (role === 'finance'    || role === 'gm') && list.status === 'supervisor_approved';
  const canFinReject  = (role === 'finance'    || role === 'gm') && list.status === 'supervisor_approved';
  const canGmRelease  = role === 'gm' && list.status === 'finance_approved';
  const isReleased    = list.status === 'released';

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Back + title */}
        <div className="page-top">
          <div className="page-heading">
            <button className="back-btn" onClick={() => router.back()}>← رجوع</button>
            <div>
              <h1 className="page-title">كشف صرف {monthName} {list.year}</h1>
              <p className="page-sub">أُنشئ بواسطة {list.created_by_name || '—'}</p>
            </div>
          </div>
          <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Summary cards */}
        <div className="summary-grid">
          <div className="sum-card">
            <span className="sum-icon">👥</span>
            <div>
              <span className="sum-val">{items.filter(i => i.included).length}</span>
              <span className="sum-lbl">مستفيد مُدرَج</span>
            </div>
          </div>
          <div className="sum-card">
            <span className="sum-icon">💰</span>
            <div>
              <span className="sum-val">{totalAmount.toLocaleString('ar-YE')}</span>
              <span className="sum-lbl">ريال إجمالي</span>
            </div>
          </div>
          <div className="sum-card">
            <span className="sum-icon">📋</span>
            <div>
              <span className="sum-val">{items.length}</span>
              <span className="sum-lbl">إجمالي البنود</span>
            </div>
          </div>
          {list.rejection_notes && (
            <div className="sum-card sum-rejected">
              <span className="sum-icon">⚠</span>
              <div>
                <span className="sum-lbl">ملاحظة الرفض</span>
                <span className="sum-notes">{list.rejection_notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Approval timeline */}
        <div className="timeline-card">
          <h2 className="section-title">مسار الاعتماد</h2>
          <div className="timeline">
            {[
              { label: 'إنشاء الكشف',    done: true,                                                                       by: list.created_by_name,  at: list.created_at },
              { label: 'اعتماد المشرف',  done: ['supervisor_approved','finance_approved','released'].includes(list.status), by: null,                  at: list.supervisor_approved_at },
              { label: 'مصادقة المالي',  done: ['finance_approved','released'].includes(list.status),                      by: null,                  at: list.finance_approved_at },
              { label: 'الإصدار النهائي', done: list.status === 'released',                                                by: null,                  at: list.gm_approved_at },
            ].map((step, i) => (
              <div key={i} className={`tl-item ${step.done ? 'tl-done' : ''}`}>
                <div className={`tl-dot ${step.done ? 'done' : ''}`}>{step.done ? '✓' : i + 1}</div>
                <div className="tl-content">
                  <span className="tl-label">{step.label}</span>
                  {step.at && (
                    <span className="tl-date">
                      {new Date(step.at).toLocaleDateString('ar-YE', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                  )}
                </div>
                {i < 3 && <div className={`tl-line ${step.done ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback banners */}
        {successMsg  && <div className="success-banner">✅ {successMsg}</div>}
        {actionError && <div className="err-banner">⚠ {actionError}</div>}
        {isReleased  && (
          <div className="released-banner">
            🚀 تم إصدار كشف الصرف بنجاح وأُشعر المناديب بتوزيع المبالغ.
          </div>
        )}

        {/* ── EXPORT BUTTONS ─────────────────────────────────────────── */}
        <div className="export-bar">
          <span className="export-label">📥 تصدير الكشف:</span>

          <button
            className="btn-export-excel"
            onClick={() => handleExport('excel')}
            disabled={exportLoading}
            title="تنزيل كشف الصرف كملف Excel"
          >
            {exportLoading
              ? <><span className="spin spin-dark" /> جارٍ التصدير…</>
              : <>📊 Excel</>}
          </button>

          <button
            className="btn-export-pdf"
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
            title="تنزيل كشف الصرف كملف PDF"
          >
            {exportLoading
              ? <><span className="spin" /> جارٍ التصدير…</>
              : <>📄 PDF</>}
          </button>

          {exportError && (
            <span className="export-error">⚠ {exportError}</span>
          )}
        </div>

        {/* Action buttons */}
        {(canSupApprove || canFinApprove || canGmRelease) && (
          <div className="actions-bar">
            <span className="actions-label">الإجراءات المتاحة:</span>
            {canSupApprove && (
              <button className="btn-approve" onClick={() => setShowSupApprove(true)}>
                ✅ اعتماد المشرف
              </button>
            )}
            {canSupReject && (
              <button className="btn-reject" onClick={() => setShowSupReject(true)}>❌ رفض</button>
            )}
            {canFinApprove && (
              <button className="btn-approve" onClick={() => setShowFinApprove(true)}>
                💜 مصادقة المالي
              </button>
            )}
            {canFinReject && (
              <button className="btn-reject" onClick={() => setShowFinReject(true)}>❌ رفض</button>
            )}
            {canGmRelease && (
              <button className="btn-release" onClick={() => setShowRelease(true)}>
                🚀 إصدار أمر الصرف
              </button>
            )}
          </div>
        )}

        {/* Items table */}
        <div className="section-card">
          <h2 className="section-title">بنود الصرف</h2>
          <ItemsTable items={items} />
        </div>

      </div>

      {/* Modals */}
      <ConfirmModal
        open={showSupApprove}
        title="اعتماد كشف الصرف"
        message={`هل تريد اعتماد كشف صرف شهر ${monthName} ${list.year} وإرساله للقسم المالي؟`}
        onConfirm={() => { setShowSupApprove(false); doAction('supervisor-approve', {}, 'تم اعتماد الكشف وإرساله للقسم المالي ✅'); }}
        onCancel={() => setShowSupApprove(false)}
        loading={actionLoading}
      />
      <ConfirmModal
        open={showFinApprove}
        title="مصادقة القسم المالي"
        message={`هل تريد مصادقة كشف صرف شهر ${monthName} ${list.year} وإرساله للمدير العام؟`}
        onConfirm={() => { setShowFinApprove(false); doAction('finance-approve', {}, 'تمت مصادقة القسم المالي وأُرسل للمدير العام ✅'); }}
        onCancel={() => setShowFinApprove(false)}
        loading={actionLoading}
      />
      <ConfirmModal
        open={showRelease}
        title="إصدار أمر الصرف النهائي"
        message={`هل تريد إصدار كشف صرف شهر ${monthName} ${list.year} نهائياً؟ قيمة إجمالية ${totalAmount.toLocaleString('ar-YE')} ريال.`}
        onConfirm={() => { setShowRelease(false); doAction('gm-release', {}, `تم إصدار كشف الصرف بنجاح 🚀 — ${totalAmount.toLocaleString('ar-YE')} ريال`); }}
        onCancel={() => setShowRelease(false)}
        loading={actionLoading}
        variant="primary"
      />
      <RejectModal
        open={showSupReject}
        onConfirm={(notes) => { setShowSupReject(false); doAction('supervisor-reject', { notes }, 'تم رفض الكشف وإشعار المُنشئ'); }}
        onCancel={() => setShowSupReject(false)}
        loading={actionLoading}
      />
      <RejectModal
        open={showFinReject}
        onConfirm={(notes) => { setShowFinReject(false); doAction('finance-reject', { notes }, 'تم رفض الكشف وإعادته للمشرف'); }}
        onCancel={() => setShowFinReject(false)}
        loading={actionLoading}
      />

      <style jsx>{`
        .page { max-width:1000px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; }

        .page-top { display:flex; align-items:center; justify-content:space-between; }
        .page-heading { display:flex; align-items:center; gap:1rem; }
        .back-btn { background:none; border:1.5px solid #dde5f0; border-radius:.625rem; padding:.5rem .9rem; font-family:'Cairo',sans-serif; font-size:.85rem; color:#1B5E8C; cursor:pointer; font-weight:600; }
        .back-btn:hover { background:#f0f7ff; }
        .page-title { font-size:1.4rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.78rem; color:#9ca3af; margin:0; }
        .status-badge { padding:.4rem 1rem; border-radius:999px; font-size:.82rem; font-weight:700; }

        .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        @media(max-width:640px){ .summary-grid{ grid-template-columns:1fr; } }
        .sum-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:.875rem; padding:1rem 1.25rem; display:flex; align-items:center; gap:.85rem; }
        .sum-icon { font-size:1.5rem; flex-shrink:0; }
        .sum-val { display:block; font-size:1.35rem; font-weight:800; color:#0d3d5c; line-height:1; }
        .sum-lbl { display:block; font-size:.72rem; color:#9ca3af; margin-top:.2rem; }
        .sum-rejected { grid-column:1/-1; border-color:#fca5a5; background:#fef2f2; }
        .sum-notes { display:block; font-size:.8rem; color:#991b1b; margin-top:.2rem; }

        .timeline-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.25rem; }
        .section-title { font-size:.9rem; font-weight:700; color:#1B5E8C; margin:0 0 1rem; }
        .timeline { display:flex; align-items:flex-start; gap:0; overflow-x:auto; padding-bottom:.25rem; }
        .tl-item { display:flex; align-items:flex-start; flex:1; min-width:120px; position:relative; }
        .tl-dot { width:28px; height:28px; border-radius:50%; background:#e5e7eb; color:#9ca3af; font-size:.7rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:2px solid #e5e7eb; }
        .tl-dot.done { background:#1B5E8C; color:#fff; border-color:#1B5E8C; }
        .tl-content { padding:0 .5rem; }
        .tl-label { display:block; font-size:.78rem; font-weight:600; color:#374151; }
        .tl-date { display:block; font-size:.68rem; color:#9ca3af; margin-top:.15rem; }
        .tl-line { flex:1; height:2px; background:#e5e7eb; margin-top:13px; }
        .tl-line.done { background:#1B5E8C; }

        /* ── EXPORT BAR ───────────────────────────────────────────────── */
        .export-bar {
          display: flex;
          align-items: center;
          gap: .75rem;
          flex-wrap: wrap;
          background: #f8fbff;
          border: 1.5px solid #dbeafe;
          border-radius: .875rem;
          padding: .85rem 1.25rem;
        }
        .export-label {
          font-size: .82rem;
          font-weight: 700;
          color: #1d4ed8;
          flex-shrink: 0;
        }
        .btn-export-excel {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .55rem 1.1rem;
          background: #fff;
          color: #065f46;
          border: 1.5px solid #6ee7b7;
          border-radius: .625rem;
          font-family: 'Cairo', sans-serif;
          font-size: .85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
        }
        .btn-export-excel:hover:not(:disabled) {
          background: #ecfdf5;
          border-color: #10b981;
        }
        .btn-export-excel:disabled { opacity: .55; cursor: not-allowed; }

        .btn-export-pdf {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          padding: .55rem 1.1rem;
          background: #1B5E8C;
          color: #fff;
          border: none;
          border-radius: .625rem;
          font-family: 'Cairo', sans-serif;
          font-size: .85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
        }
        .btn-export-pdf:hover:not(:disabled) { background: #134569; }
        .btn-export-pdf:disabled { opacity: .55; cursor: not-allowed; }

        .export-error {
          font-size: .78rem;
          color: #b91c1c;
          font-weight: 600;
        }

        .actions-bar { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; background:#fff; border:1.5px solid #e5eaf0; border-radius:.875rem; padding:1rem 1.25rem; }
        .actions-label { font-size:.8rem; color:#6b7280; font-weight:600; flex-shrink:0; }
        .btn-approve { background:#1B5E8C; color:#fff; border:none; border-radius:.625rem; padding:.65rem 1.4rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; cursor:pointer; transition:background .15s; }
        .btn-approve:hover { background:#134569; }
        .btn-reject { background:#fef2f2; color:#dc2626; border:1.5px solid #fca5a5; border-radius:.625rem; padding:.65rem 1.4rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; cursor:pointer; }
        .btn-release { background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; border:none; border-radius:.75rem; padding:.75rem 2rem; font-family:'Cairo',sans-serif; font-size:.95rem; font-weight:800; cursor:pointer; box-shadow:0 2px 12px rgba(27,94,140,.3); transition:all .15s; letter-spacing:.02em; }
        .btn-release:hover { transform:translateY(-1px); box-shadow:0 4px 18px rgba(27,94,140,.4); }

        .section-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.25rem; }
        .table-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; font-size:.82rem; color:#6b7280; }
        .table-total { font-size:.85rem; color:#0d3d5c; }
        .table-total strong { color:#1B5E8C; }
        .table-wrap { overflow-x:auto; }
        .items-table { width:100%; border-collapse:collapse; font-size:.8rem; }
        .items-table th { text-align:right; padding:.6rem .75rem; font-size:.72rem; font-weight:700; color:#9ca3af; border-bottom:2px solid #f3f4f6; white-space:nowrap; }
        .items-table td { padding:.65rem .75rem; color:#374151; border-bottom:1px solid #f9fafb; }
        .items-table tr:last-child td { border-bottom:none; }
        .items-table tr:hover td { background:#fafafa; }
        .row-excluded td { opacity:.55; }
        .td-num { color:#9ca3af; font-size:.72rem; }
        .td-name { font-weight:600; color:#0d3d5c; }
        .td-amount { font-weight:700; color:#1B5E8C; direction:ltr; text-align:left; }
        .badge-included { display:inline-block; background:#ECFDF5; color:#065F46; border-radius:999px; padding:.15rem .55rem; font-size:.68rem; font-weight:700; }
        .badge-excluded { display:inline-block; background:#fef2f2; color:#991B1B; border-radius:999px; padding:.15rem .55rem; font-size:.68rem; font-weight:700; cursor:help; }

        .success-banner { background:#ECFDF5; border:1px solid #6EE7B7; color:#065F46; padding:.85rem 1.1rem; border-radius:.75rem; font-size:.875rem; font-weight:600; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.75rem 1rem; border-radius:.75rem; font-size:.875rem; }
        .released-banner { background:linear-gradient(135deg,#ECFDF5,#d1fae5); border:1.5px solid #6EE7B7; color:#065F46; padding:1rem 1.25rem; border-radius:.875rem; font-size:.9rem; font-weight:700; }
        .mt { margin-top:.5rem; }

        .loading-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh; gap:1rem; color:#6b7280; font-size:.85rem; }
        .spinner-lg { width:36px; height:36px; border:3px solid #e5eaf0; border-top-color:#1B5E8C; border-radius:50%; animation:spin .7s linear infinite; }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:999; display:flex; align-items:center; justify-content:center; padding:1rem; }
        .modal-box { background:#fff; border-radius:1rem; padding:2rem; max-width:440px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.2); }
        .modal-title { font-size:1.1rem; font-weight:800; color:#0d3d5c; margin:0 0 .6rem; }
        .modal-msg { font-size:.875rem; color:#6b7280; margin:0 0 1.25rem; line-height:1.7; }
        .modal-actions { display:flex; justify-content:flex-end; gap:.75rem; }
        .notes-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-family:'Cairo',sans-serif; font-size:.875rem; resize:vertical; margin-bottom:1.25rem; box-sizing:border-box; }
        .notes-inp:focus { outline:none; border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,.1); }

        .btn-primary { background:#1B5E8C; color:#fff; border:none; border-radius:.625rem; padding:.65rem 1.4rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:.4rem; }
        .btn-danger { background:#dc2626; color:#fff; border:none; border-radius:.625rem; padding:.65rem 1.4rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:.4rem; }
        .btn-danger:disabled, .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
        .btn-ghost { background:none; border:1.5px solid #dde5f0; border-radius:.625rem; padding:.65rem 1.25rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; color:#6b7280; cursor:pointer; }
        .btn-ghost:hover { background:#f9fafb; }

        .spin { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        .spin-dark { border-color:rgba(0,0,0,.15); border-top-color:#065f46; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .empty { text-align:center; color:#9ca3af; font-size:.85rem; padding:2rem 0; }
      `}</style>
    </AppShell>
  );
}
