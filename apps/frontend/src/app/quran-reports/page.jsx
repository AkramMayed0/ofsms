'use client';

/**
 * page.jsx
 * Route:  /quran-reports  (Agent sees own reports, Supervisor sees all pending)
 * Task:   feature/ui-quran-report-submission
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTHS_AR = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const STATUS_MAP = {
  pending:  { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fffbeb' },
  approved: { label: 'معتمد',         color: '#10b981', bg: '#ecfdf5' },
  rejected: { label: 'مرفوض',         color: '#ef4444', bg: '#fef2f2' },
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
};

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'.3rem',
      padding:'.2rem .65rem', borderRadius:'2rem',
      fontSize:'.72rem', fontWeight:700,
      color:cfg.color, background:cfg.bg,
      border:`1px solid ${cfg.color}25`, whiteSpace:'nowrap',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

// ── SubmitReportModal ──────────────────────────────────────────────────────────

function SubmitReportModal({ orphans, onClose, onSubmitted }) {
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [juz,    setJuz]    = useState(0.5);

  const now = new Date();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      orphanId: '',
      month: now.getMonth() + 1,
      year:  now.getFullYear(),
    },
  });

  const selectedOrphanId = watch('orphanId');
  const selectedOrphan   = orphans.find(o => o.id === selectedOrphanId);
  const age              = selectedOrphan ? calcAge(selectedOrphan.date_of_birth) : null;

  // Suggested target based on age (configurable on backend, this is UI guidance)
  const suggestedJuz = age == null ? null
    : age < 7  ? 0.5
    : age < 10 ? 1
    : age < 13 ? 1.5
    : 2;

  const onSubmit = async (data) => {
    setSaving(true);
    setApiErr('');
    try {
      await api.post('/quran-reports', {
        orphanId: data.orphanId,
        month: parseInt(data.month),
        year:  parseInt(data.year),
        juzMemorized: juz,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setApiErr(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'حدث خطأ. يرجى المحاولة مجدداً'
      );
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">رفع تقرير حفظ القرآن</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {apiErr && <div className="err-banner">⚠ {apiErr}</div>}

          {/* Orphan select */}
          <div className="fg">
            <label className="lbl">اليتيم <span className="req">*</span></label>
            <select
              className={`inp sel ${errors.orphanId ? 'inp-err' : ''}`}
              {...register('orphanId', { required: 'يرجى اختيار اليتيم' })}
            >
              <option value="">اختر اليتيم…</option>
              {orphans.map(o => (
                <option key={o.id} value={o.id}>{o.full_name}</option>
              ))}
            </select>
            {errors.orphanId && <p className="ferr">{errors.orphanId.message}</p>}
            {selectedOrphan && (
              <p className="field-hint">
                {selectedOrphan.governorate_ar} · العمر: {age} سنة
                {suggestedJuz && ` · الحصة المقترحة: ${suggestedJuz} جزء`}
              </p>
            )}
          </div>

          {/* Month / Year row */}
          <div className="two-col">
            <div className="fg">
              <label className="lbl">الشهر <span className="req">*</span></label>
              <select className="inp sel" {...register('month')}>
                {MONTHS_AR.slice(1).map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="fg">
              <label className="lbl">السنة <span className="req">*</span></label>
              <select className="inp sel" {...register('year')}>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Juz memorized stepper */}
          <div className="fg">
            <label className="lbl">
              عدد الأجزاء المحفوظة <span className="req">*</span>
            </label>
            <div className="juz-stepper">
              <button type="button" className="juz-btn"
                onClick={() => setJuz(Math.max(0, parseFloat((juz - 0.5).toFixed(1))))}
                disabled={juz <= 0}
              >−</button>
              <div className="juz-display">
                <span className="juz-val">{juz}</span>
                <span className="juz-unit">جزء</span>
              </div>
              <button type="button" className="juz-btn"
                onClick={() => setJuz(Math.min(30, parseFloat((juz + 0.5).toFixed(1))))}
                disabled={juz >= 30}
              >+</button>
            </div>
            <div className="juz-quick">
              {[0.5, 1, 1.5, 2, 3].map(v => (
                <button
                  key={v} type="button"
                  className={`juz-quick-btn ${juz === v ? 'juz-quick-active' : ''}`}
                  onClick={() => setJuz(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            {suggestedJuz && juz < suggestedJuz && (
              <p className="juz-warning">
                ⚠ الحصة المقترحة لهذه الفئة العمرية هي {suggestedJuz} جزء
              </p>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="spin" />جارٍ الرفع…</> : 'رفع التقرير'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:50; animation:fadeIn .2s; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:480px; max-width:95vw; background:#fff; border-radius:1.25rem; z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2); font-family:'Cairo','Tajawal',sans-serif; animation:slideUp .2s ease; max-height:90vh; overflow-y:auto; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translate(-50%,-45%)} to{opacity:1;transform:translate(-50%,-50%)} }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; position:sticky; top:0; background:#fff; z-index:1; }
        .modal-title { font-size:1rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; }
        .modal-body { display:flex; flex-direction:column; gap:1.1rem; padding:1.5rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; border-top:1px solid #f0f4f8; padding-top:1rem; margin-top:.5rem; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .inp { border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; width:100%; box-sizing:border-box; transition:border-color .15s; }
        .inp:focus { border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; }
        .sel { appearance:none; cursor:pointer; }
        .ferr { font-size:.77rem; color:#dc2626; margin:0; }
        .field-hint { font-size:.72rem; color:#94a3b8; margin:0; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.625rem; padding:.65rem .85rem; font-size:.82rem; color:#b91c1c; }
        .juz-stepper { display:flex; align-items:center; gap:1rem; background:#f8fafc; border:1.5px solid #e5eaf0; border-radius:.75rem; padding:.65rem 1rem; width:fit-content; }
        .juz-btn { width:34px; height:34px; border-radius:50%; border:1.5px solid #d1d5db; background:#fff; font-size:1.1rem; font-weight:700; color:#374151; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .juz-btn:hover:not(:disabled) { border-color:#1B5E8C; color:#1B5E8C; }
        .juz-btn:disabled { opacity:.35; cursor:not-allowed; }
        .juz-display { display:flex; flex-direction:column; align-items:center; min-width:60px; }
        .juz-val { font-size:1.8rem; font-weight:800; color:#0d3d5c; line-height:1; font-family:'Cairo',sans-serif; }
        .juz-unit { font-size:.72rem; color:#94a3b8; font-weight:600; }
        .juz-quick { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.35rem; }
        .juz-quick-btn { padding:.25rem .65rem; border:1.5px solid #e5eaf0; border-radius:2rem; font-size:.75rem; font-weight:600; color:#6b7280; background:#fff; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; }
        .juz-quick-btn:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .juz-quick-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .juz-warning { font-size:.75rem; color:#f59e0b; font-weight:600; margin:0; }
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost { display:inline-flex; align-items:center; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function QuranReportsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [reports,     setReports]     = useState([]);
  const [orphans,     setOrphans]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showSubmit,  setShowSubmit]  = useState(false);
  const [acting,      setActing]      = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchReports = () => {
    setLoading(true);
    const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
    api.get(`/quran-reports${params}`)
      .then(({ data }) => setReports(data.reports || []))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [filterStatus]);

  // Agents need their orphans list for the submit modal
  useEffect(() => {
    if (role === 'agent') {
      api.get('/orphans?status=under_sponsorship')
        .then(({ data }) => setOrphans(data.orphans || []))
        .catch(() => {});
    }
  }, [role]);

  const handleApprove = async (id) => {
    setActing(true);
    try {
      await api.patch(`/quran-reports/${id}/approve`);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الاعتماد');
    } finally { setActing(false); }
  };

  const handleReject = async (id) => {
    const notes = window.prompt('سبب الرفض (اختياري):') ?? '';
    setActing(true);
    try {
      await api.patch(`/quran-reports/${id}/reject`, { notes });
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل الرفض');
    } finally { setActing(false); }
  };

  const counts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filterStatus === 'all'
    ? reports
    : reports.filter(r => r.status === filterStatus);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">تقارير حفظ القرآن</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${reports.length} تقرير · ${counts.pending || 0} قيد المراجعة`}
            </p>
          </div>
          {role === 'agent' && (
            <button className="btn-primary" onClick={() => setShowSubmit(true)}>
              + رفع تقرير جديد
            </button>
          )}
        </div>

        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[
            { key: 'all',      label: 'الكل',           count: reports.length },
            { key: 'pending',  label: 'قيد المراجعة',   count: counts.pending  || 0 },
            { key: 'approved', label: 'المعتمدة',        count: counts.approved || 0 },
            { key: 'rejected', label: 'المرفوضة',        count: counts.rejected || 0 },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`ftab ${filterStatus === key ? 'ftab-active' : ''}`}
              onClick={() => setFilterStatus(key)}
            >
              {label} <span className="ftab-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="table-wrap">
            {[1,2,3,4].map(i => (
              <div key={i} className="skel-row">
                <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: '45%', height: 13, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '30%', height: 11 }} />
                </div>
                <div className="skel" style={{ width: 90, height: 22, borderRadius: '2rem' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: '3rem' }}>📖</div>
            <h3 className="empty-title">
              {filterStatus !== 'all' ? 'لا توجد تقارير بهذه الحالة' : 'لا توجد تقارير حفظ بعد'}
            </h3>
            {role === 'agent' && filterStatus === 'all' && (
              <button className="btn-primary" onClick={() => setShowSubmit(true)}>
                + رفع أول تقرير
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم اليتيم</th>
                  <th>المحافظة</th>
                  <th>الشهر / السنة</th>
                  <th>الأجزاء المحفوظة</th>
                  <th>الحالة</th>
                  <th>تاريخ الرفع</th>
                  {(role === 'supervisor' || role === 'gm') && <th>إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="trow">
                    <td>
                      <div className="name-cell">
                        <div className="avatar">📖</div>
                        <div>
                          <div className="name-text">{r.orphan_name}</div>
                          {r.supervisor_notes && r.status === 'rejected' && (
                            <div className="rejection-note">↩ {r.supervisor_notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{r.governorate_ar || '—'}</td>
                    <td className="muted">{MONTHS_AR[r.month]} {r.year}</td>
                    <td>
                      <span className="juz-chip">{r.juz_memorized} جزء</span>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="muted">{formatDate(r.submitted_at)}</td>
                    {(role === 'supervisor' || role === 'gm') && (
                      <td>
                        {r.status === 'pending' && (
                          <div className="action-btns">
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(r.id)}
                              disabled={acting}
                            >✅</button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(r.id)}
                              disabled={acting}
                            >✕</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitReportModal
          orphans={orphans}
          onClose={() => setShowSubmit(false)}
          onSubmitted={fetchReports}
        />
      )}

      <style jsx>{`
        .page { max-width:1100px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; }

        .filter-tabs { display:flex; gap:.4rem; flex-wrap:wrap; }
        .ftab { display:inline-flex; align-items:center; gap:.35rem; padding:.4rem .85rem; border:1.5px solid #e5eaf0; border-radius:2rem; font-size:.78rem; font-weight:600; color:#6b7280; background:#fff; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; }
        .ftab:hover { border-color:#1B5E8C; color:#1B5E8C; }
        .ftab-active { border-color:#1B5E8C; background:#1B5E8C; color:#fff; }
        .ftab-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 4px; border-radius:2rem; background:#f0f4f8; color:#6b7280; font-size:.7rem; font-weight:700; }
        .ftab-active .ftab-count { background:rgba(255,255,255,.25); color:#fff; }

        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.75rem 1.1rem; text-align:right; font-size:.72rem; font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap; }
        .table td { padding:.8rem 1.1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow:last-child td { border-bottom:none; }
        .name-cell { display:flex; align-items:flex-start; gap:.65rem; }
        .avatar { width:34px; height:34px; border-radius:50%; background:#f0f7ff; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .name-text { font-weight:700; color:#1f2937; }
        .rejection-note { font-size:.72rem; color:#ef4444; margin-top:.2rem; font-style:italic; }
        .muted { color:#6b7a8d; }
        .juz-chip { display:inline-flex; align-items:center; padding:.2rem .65rem; background:#f0f7ff; border:1px solid #bfdbfe; border-radius:2rem; font-size:.78rem; font-weight:700; color:#1d4ed8; }
        .action-btns { display:flex; gap:.35rem; }
        .approve-btn { width:30px; height:30px; border-radius:50%; border:1.5px solid #6ee7b7; background:#ecfdf5; color:#059669; cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .approve-btn:hover:not(:disabled) { background:#d1fae5; }
        .approve-btn:disabled { opacity:.5; cursor:not-allowed; }
        .reject-btn { width:30px; height:30px; border-radius:50%; border:1.5px solid #fca5a5; background:#fef2f2; color:#dc2626; cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; transition:all .15s; }
        .reject-btn:hover:not(:disabled) { background:#fee2e2; }
        .reject-btn:disabled { opacity:.5; cursor:not-allowed; }
        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1.1rem; border-bottom:1px solid #f8fafc; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        @keyframes shimmer { to{background-position:-200% 0} }
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:280px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1rem; font-weight:700; color:#374151; margin:0; }
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(2), .table td:nth-child(2),
          .table th:nth-child(6), .table td:nth-child(6) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}
