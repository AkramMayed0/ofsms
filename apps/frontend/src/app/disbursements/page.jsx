'use client';

/**
 * page.jsx
 * Route:  /disbursements  (Supervisor, Finance, GM)
 * Task:   feature/ui-disbursement-supervisor
 *
 * Lists all disbursement lists with workflow status.
 * Supervisor: can generate new list, approve, or reject with notes.
 * Finance: can authorize or reject back to supervisor.
 * GM: can release funds after finance approval.
 * Clicking a row opens full items detail drawer.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  draft:               { label: 'مسودة',           color: '#6b7280', bg: '#f3f4f6' },
  supervisor_approved: { label: 'اعتمد المشرف',    color: '#f59e0b', bg: '#fffbeb' },
  finance_approved:    { label: 'اعتمد المالي',    color: '#3b82f6', bg: '#eff6ff' },
  released:            { label: 'تم الصرف',         color: '#10b981', bg: '#ecfdf5' },
  rejected:            { label: 'مرفوض',            color: '#ef4444', bg: '#fef2f2' },
};

const MONTHS_AR = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate   = (iso) => iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';
const formatAmount = (n)   => n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.25rem .75rem', borderRadius: '2rem',
      fontSize: '.72rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}25`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── RejectModal ────────────────────────────────────────────────────────────────

function RejectModal({ title, onConfirm, onClose, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" dir="rtl">
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit((d) => onConfirm(d.notes))} className="modal-body">
          <div className="fg">
            <label className="lbl">سبب الرفض <span className="req">*</span></label>
            <textarea
              className={`inp ta ${errors.notes ? 'inp-err' : ''}`}
              rows={4}
              placeholder="أدخل سبب الرفض بوضوح…"
              {...register('notes', { required: 'سبب الرفض مطلوب' })}
            />
            {errors.notes && <p className="ferr">{errors.notes.message}</p>}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-danger" disabled={loading}>
              {loading ? <><span className="spin" />جارٍ الرفض…</> : 'تأكيد الرفض'}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:50; }
        .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:440px; max-width:95vw; background:#fff; border-radius:1.25rem; z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2); font-family:'Cairo','Tajawal',sans-serif; animation:slideUp .2s ease; }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; }
        .modal-body { display:flex; flex-direction:column; gap:1rem; padding:1.5rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; border-top:1px solid #f0f4f8; padding-top:1rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .inp { border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; width:100%; box-sizing:border-box; transition:border-color .15s; }
        .inp:focus { border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; }
        .ta { resize:vertical; min-height:100px; }
        .ferr { font-size:.77rem; color:#dc2626; margin:0; }
        .btn-ghost { display:inline-flex; align-items:center; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; }
        .btn-danger { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:#dc2626; color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:background .15s; }
        .btn-danger:hover:not(:disabled) { background:#b91c1c; }
        .btn-danger:disabled { opacity:.65; cursor:not-allowed; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── ItemsDrawer ────────────────────────────────────────────────────────────────

function ItemsDrawer({ listId, listInfo, role, onClose, onAction }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [showReject, setShowReject] = useState(false);

  const fetchDetail = () => {
    if (!listId) return;
    setLoading(true);
    api.get(`/disbursements/${listId}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [listId]);

  if (!listId) return null;

  const items    = detail?.items || [];
  const included = items.filter(i => i.included);
  const excluded = items.filter(i => !i.included);
  const total    = included.reduce((s, i) => s + parseFloat(i.amount || 0), 0);

  const doAction = async (endpoint) => {
    setActing(true);
    try {
      await api.patch(`/disbursements/${listId}/${endpoint}`);
      onAction();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'حدث خطأ');
    } finally { setActing(false); }
  };

  const doReject = async (notes) => {
    setActing(true);
    try {
      const endpoint = role === 'finance' ? 'finance-reject' : 'reject';
      await api.patch(`/disbursements/${listId}/${endpoint}`, { notes });
      onAction();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'حدث خطأ');
    } finally { setActing(false); setShowReject(false); }
  };

  const status = listInfo?.status;

  // Which action buttons to show per role + status
  const canSupApprove  = role === 'supervisor' && status === 'draft';
  const canSupReject   = role === 'supervisor' && status === 'draft';
  const canFinApprove  = role === 'finance'    && status === 'supervisor_approved';
  const canFinReject   = role === 'finance'    && status === 'supervisor_approved';
  const canGmRelease   = role === 'gm'         && status === 'finance_approved';

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" dir="rtl">
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title">
              كشف الصرف — {MONTHS_AR[listInfo?.month]} {listInfo?.year}
            </h2>
            <div style={{ marginTop: '.35rem' }}>
              {listInfo && <StatusBadge status={listInfo.status} />}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary strip */}
        <div className="drawer-summary">
          <div className="sum-item">
            <span className="sum-val">{included.length}</span>
            <span className="sum-lbl">مستفيد مشمول</span>
          </div>
          <div className="sum-div" />
          <div className="sum-item">
            <span className="sum-val" style={{ color: '#ef4444' }}>{excluded.length}</span>
            <span className="sum-lbl">مستبعد</span>
          </div>
          <div className="sum-div" />
          <div className="sum-item">
            <span className="sum-val" style={{ color: '#10b981', fontSize: '.95rem' }}>
              {formatAmount(total)}
            </span>
            <span className="sum-lbl">الإجمالي</span>
          </div>
        </div>

        {/* Rejection notes if rejected */}
        {listInfo?.rejection_notes && (
          <div className="rejection-box">
            <span>⚠</span>
            <div>
              <strong>سبب الرفض</strong>
              <p>{listInfo.rejection_notes}</p>
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skel-row">
                  <div className="skel" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ width: '55%', height: 13, marginBottom: 5 }} />
                    <div className="skel" style={{ width: '35%', height: 11 }} />
                  </div>
                  <div className="skel" style={{ width: 80, height: 13 }} />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="drawer-empty">
              <span style={{ fontSize: '2rem' }}>📋</span>
              <p>لا توجد بنود في هذا الكشف</p>
            </div>
          ) : (
            <>
              {/* Included */}
              <div className="items-section-title">
                المشمولون ({included.length})
              </div>
              {included.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-avatar">
                    {item.beneficiary_type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.beneficiary_name}</div>
                    <div className="item-meta">
                      <span>{item.governorate_ar || '—'}</span>
                      {item.sponsor_name && <span>· {item.sponsor_name}</span>}
                      {item.biometric_confirmed_at && (
                        <span className="bio-tag">✅ بصمة</span>
                      )}
                    </div>
                  </div>
                  <div className="item-amount">{formatAmount(item.amount)}</div>
                </div>
              ))}

              {/* Excluded */}
              {excluded.length > 0 && (
                <>
                  <div className="items-section-title" style={{ color: '#ef4444', marginTop: '1rem' }}>
                    المستبعدون ({excluded.length})
                  </div>
                  {excluded.map((item) => (
                    <div key={item.id} className="item-row item-excluded">
                      <div className="item-avatar" style={{ opacity: .5 }}>
                        {item.beneficiary_type === 'orphan' ? '👦' : '👨‍👩‍👧'}
                      </div>
                      <div className="item-info">
                        <div className="item-name" style={{ opacity: .6 }}>{item.beneficiary_name}</div>
                        <div className="item-meta">
                          <span className="excl-reason">{item.exclusion_reason || 'مستبعد'}</span>
                        </div>
                      </div>
                      <div className="item-amount" style={{ opacity: .4 }}>{formatAmount(item.amount)}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="drawer-foot">
          {canSupApprove && (
            <button className="btn-success" onClick={() => doAction('approve')} disabled={acting}>
              {acting ? <><span className="spin-g" />جارٍ الاعتماد…</> : '✅ اعتماد الكشف'}
            </button>
          )}
          {canFinApprove && (
            <button className="btn-success" onClick={() => doAction('finance-approve')} disabled={acting}>
              {acting ? <><span className="spin-g" />جارٍ التصديق…</> : '✅ تصديق مالي'}
            </button>
          )}
          {canGmRelease && (
            <button className="btn-success" onClick={() => doAction('release')} disabled={acting}>
              {acting ? <><span className="spin-g" />جارٍ الإصدار…</> : '🚀 إصدار الأموال'}
            </button>
          )}
          {(canSupReject || canFinReject) && (
            <button className="btn-danger" onClick={() => setShowReject(true)} disabled={acting}>
              ✕ رفض الكشف
            </button>
          )}
          <button className="btn-ghost-sm" onClick={onClose}>إغلاق</button>
        </div>
      </aside>

      {showReject && (
        <RejectModal
          title="رفض كشف الصرف"
          onConfirm={doReject}
          onClose={() => setShowReject(false)}
          loading={acting}
        />
      )}

      <style jsx>{`
        .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:40; animation:fadeIn .2s ease; }
        .drawer { position:fixed; top:0; left:0; width:520px; max-width:96vw; height:100vh; background:#fff; z-index:50; display:flex; flex-direction:column; box-shadow:-4px 0 24px rgba(0,0,0,.12); animation:slideIn .25s ease; font-family:'Cairo','Tajawal',sans-serif; }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }

        .drawer-head { display:flex; align-items:flex-start; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; gap:1rem; }
        .drawer-title { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0; }
        .drawer-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem; flex-shrink:0; }

        .drawer-summary { display:flex; align-items:center; padding:1rem 1.5rem; background:#f8fafc; border-bottom:1px solid #e5eaf0; gap:1rem; }
        .sum-item { display:flex; flex-direction:column; align-items:center; gap:.2rem; flex:1; }
        .sum-val { font-size:1rem; font-weight:800; color:#0d3d5c; font-family:'Cairo',sans-serif; }
        .sum-lbl { font-size:.68rem; color:#94a3b8; font-weight:600; }
        .sum-div { width:1px; height:32px; background:#e5eaf0; flex-shrink:0; }

        .rejection-box { display:flex; gap:.75rem; background:#fef2f2; border-bottom:1px solid #fecaca; padding:1rem 1.5rem; }
        .rejection-box span { font-size:1.1rem; flex-shrink:0; }
        .rejection-box strong { display:block; font-size:.85rem; color:#b91c1c; margin-bottom:.25rem; }
        .rejection-box p { font-size:.82rem; color:#dc2626; margin:0; line-height:1.5; }

        .drawer-body { flex:1; overflow-y:auto; padding:1rem 1.5rem; display:flex; flex-direction:column; }
        .items-section-title { font-size:.75rem; font-weight:700; color:#6b7a8d; text-transform:uppercase; letter-spacing:.05em; margin:.5rem 0 .65rem; }
        .drawer-empty { display:flex; flex-direction:column; align-items:center; padding:3rem; gap:.5rem; text-align:center; }
        .drawer-empty p { font-size:.83rem; color:#94a3b8; margin:0; }

        .item-row { display:flex; align-items:center; gap:.75rem; padding:.6rem .4rem; border-bottom:1px solid #f8fafc; transition:background .1s; }
        .item-row:hover { background:#f8fbff; }
        .item-excluded { background:#fff8f8; }
        .item-avatar { width:34px; height:34px; border-radius:50%; background:#f0f4f8; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .item-info { flex:1; min-width:0; }
        .item-name { font-size:.83rem; font-weight:700; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .item-meta { display:flex; gap:.35rem; font-size:.7rem; color:#6b7a8d; flex-wrap:wrap; margin-top:.15rem; }
        .bio-tag { color:#10b981; font-weight:700; }
        .excl-reason { color:#ef4444; font-weight:600; }
        .item-amount { font-size:.83rem; font-weight:700; color:#1B5E8C; flex-shrink:0; font-family:'Cairo',sans-serif; }

        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        .skel-row { display:flex; align-items:center; gap:.75rem; padding:.6rem 0; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .drawer-foot { padding:1rem 1.5rem; border-top:1px solid #f0f4f8; display:flex; gap:.65rem; flex-wrap:wrap; justify-content:flex-end; }
        .btn-success { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.25rem; background:#059669; color:#fff; font-family:'Cairo',sans-serif; font-size:.85rem; font-weight:700; border:none; border-radius:.625rem; cursor:pointer; transition:background .15s; }
        .btn-success:hover:not(:disabled) { background:#047857; }
        .btn-success:disabled { opacity:.65; cursor:not-allowed; }
        .btn-danger { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.25rem; background:#dc2626; color:#fff; font-family:'Cairo',sans-serif; font-size:.85rem; font-weight:700; border:none; border-radius:.625rem; cursor:pointer; transition:background .15s; }
        .btn-danger:hover:not(:disabled) { background:#b91c1c; }
        .btn-danger:disabled { opacity:.65; cursor:not-allowed; }
        .btn-ghost-sm { display:inline-flex; align-items:center; padding:.6rem 1.1rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.625rem; cursor:pointer; }
        .btn-ghost-sm:hover { background:#f0f7ff; }
        .spin-g { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DisbursementsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [lists,      setLists]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [selected,   setSelected]   = useState(null);

  const fetchLists = () => {
    setLoading(true);
    api.get('/disbursements')
      .then(({ data }) => setLists(data.lists || []))
      .catch(() => setError('تعذّر تحميل البيانات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLists(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/disbursements/generate');
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إنشاء الكشف');
    } finally { setGenerating(false); }
  };

  const selectedList = lists.find(l => l.id === selected);

  const pendingCount = lists.filter(l =>
    (role === 'supervisor' && l.status === 'draft') ||
    (role === 'finance'    && l.status === 'supervisor_approved') ||
    (role === 'gm'         && l.status === 'finance_approved')
  ).length;

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">كشوف الصرف الشهري</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${lists.length} كشف · ${pendingCount} بانتظار إجراء`}
            </p>
          </div>
          {(role === 'supervisor' || role === 'gm') && (
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <><span className="spin" />جارٍ الإنشاء…</> : '+ إنشاء كشف هذا الشهر'}
            </button>
          )}
        </div>

        {error && (
          <div className="err-banner">
            <span>⚠</span> {error}
            <button className="err-close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Pending action alert */}
        {!loading && pendingCount > 0 && (
          <div className="alert-card">
            <span style={{ fontSize: '1.3rem' }}>🔔</span>
            <div>
              <strong>لديك {pendingCount} {pendingCount === 1 ? 'كشف' : 'كشوف'} بانتظار إجراءك</strong>
              <p>اضغط على الكشف لمراجعته واتخاذ الإجراء المناسب</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="table-wrap">
            {[1,2,3].map(i => (
              <div key={i} className="skel-row">
                <div className="skel" style={{ width: 80, height: 14 }} />
                <div style={{ flex: 1 }}><div className="skel" style={{ width: '40%', height: 14 }} /></div>
                <div className="skel" style={{ width: 100, height: 24, borderRadius: '2rem' }} />
                <div className="skel" style={{ width: 90, height: 14 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && lists.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: '3rem' }}>💰</div>
            <h3 className="empty-title">لا توجد كشوف صرف بعد</h3>
            <p className="empty-sub">أنشئ كشف الشهر الحالي للبدء</p>
            {(role === 'supervisor' || role === 'gm') && (
              <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                + إنشاء كشف هذا الشهر
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && lists.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الشهر / السنة</th>
                  <th>المستفيدون</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>اعتماد المشرف</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => {
                  const needsAction =
                    (role === 'supervisor' && list.status === 'draft') ||
                    (role === 'finance'    && list.status === 'supervisor_approved') ||
                    (role === 'gm'         && list.status === 'finance_approved');

                  return (
                    <tr
                      key={list.id}
                      className={`trow ${needsAction ? 'trow-urgent' : ''}`}
                      onClick={() => setSelected(list.id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(list.id)}
                    >
                      <td>
                        <div className="month-cell">
                          {needsAction && <span className="urgent-dot" />}
                          <span className="month-badge">
                            {MONTHS_AR[list.month]} {list.year}
                          </span>
                        </div>
                      </td>
                      <td className="muted">
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{list.included_count}</span>
                        {list.excluded_count > 0 && (
                          <span style={{ color: '#ef4444', marginRight: '.35rem' }}>
                            (-{list.excluded_count})
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#1B5E8C' }}>
                        {formatAmount(list.total_amount)}
                      </td>
                      <td><StatusBadge status={list.status} /></td>
                      <td className="muted">{formatDate(list.created_at)}</td>
                      <td className="muted">
                        {list.supervisor_approved_at ? formatDate(list.supervisor_approved_at) : '—'}
                      </td>
                      <td>
                        <button
                          className={`action-btn ${needsAction ? 'action-btn-urgent' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setSelected(list.id); }}
                        >
                          {needsAction ? 'مراجعة ←' : 'عرض ←'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <ItemsDrawer
        listId={selected}
        listInfo={selectedList}
        role={role}
        onClose={() => setSelected(null)}
        onAction={fetchLists}
      />

      <style jsx>{`
        .page { max-width:1100px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        .err-banner { display:flex; align-items:center; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:500; }
        .err-close { background:none; border:none; cursor:pointer; color:#b91c1c; font-size:.85rem; margin-right:auto; }

        .alert-card { display:flex; align-items:flex-start; gap:.85rem; background:#fffbeb; border:1.5px solid #fde68a; border-radius:1rem; padding:1rem 1.25rem; }
        .alert-card strong { display:block; font-size:.9rem; font-weight:700; color:#92400e; margin-bottom:.2rem; }
        .alert-card p { font-size:.82rem; color:#b45309; margin:0; }

        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.8rem 1.1rem; text-align:right; font-size:.72rem; font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap; }
        .table td { padding:.85rem 1.1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow:last-child td { border-bottom:none; }
        .trow-urgent { background:#fffdf0; }
        .trow-urgent:hover { background:#fffbeb; }

        .month-cell { display:flex; align-items:center; gap:.5rem; }
        .urgent-dot { width:8px; height:8px; border-radius:50%; background:#f59e0b; flex-shrink:0; animation:pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .month-badge { font-size:.85rem; font-weight:700; color:#0d3d5c; }
        .muted { color:#6b7a8d; }

        .action-btn { background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap; }
        .action-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }
        .action-btn-urgent { border-color:#f59e0b; color:#b45309; background:#fffbeb; }
        .action-btn-urgent:hover { background:#fef3c7; }

        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1.1rem; border-bottom:1px solid #f8fafc; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1.05rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(5), .table td:nth-child(5),
          .table th:nth-child(6), .table td:nth-child(6) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}
