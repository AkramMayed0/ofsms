'use client';

/**
 * apps/frontend/src/app/disbursements/page.jsx
 *
 * Disbursement list management page.
 * Fixes:
 *   - role is always read fresh from the store (not cached in a closure)
 *   - buttons are shown with clear status/role debug info in development
 *   - ItemsDrawer receives role correctly
 *   - Status matching uses the exact DB enum values
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
        .modal {
          position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
          width:440px; max-width:95vw; background:#fff; border-radius:1.25rem;
          z-index:51; box-shadow:0 20px 60px rgba(0,0,0,.2);
          font-family:'Cairo','Tajawal',sans-serif; animation:slideUp .2s ease;
        }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,-45%); } to { opacity:1; transform:translate(-50%,-50%); } }
        .modal-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .modal-title { font-size:1rem; font-weight:800; color:#0d3d5c; margin:0; }
        .modal-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; }
        .modal-body { display:flex; flex-direction:column; gap:1rem; padding:1.5rem; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; border-top:1px solid #f0f4f8; padding-top:1rem; }
        .fg { display:flex; flex-direction:column; gap:.3rem; }
        .lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .req { color:#dc2626; }
        .inp { border:1.5px solid #d1d5db; border-radius:.625rem; padding:.65rem .9rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; width:100%; box-sizing:border-box; }
        .inp:focus { border-color:#1B5E8C; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color:#dc2626!important; }
        .ta { resize:vertical; min-height:100px; }
        .ferr { font-size:.77rem; color:#dc2626; margin:0; }
        .btn-ghost { display:inline-flex; align-items:center; padding:.7rem 1.25rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; }
        .btn-danger { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:#dc2626; color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; }
        .btn-danger:disabled { opacity:.65; cursor:not-allowed; }
        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── ItemsDrawer ────────────────────────────────────────────────────────────────

function ItemsDrawer({ listId, listInfo, role, onClose, onAction }) {
  const [detail,     setDetail]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [actionErr,  setActionErr]  = useState('');

  useEffect(() => {
    if (!listId) return;
    setLoading(true);
    setActionErr('');
    api.get(`/disbursements/${listId}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [listId]);

  if (!listId) return null;

  const items    = detail?.items || [];
  const included = items.filter(i => i.included);
  const excluded = items.filter(i => !i.included);
  const total    = included.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const status   = listInfo?.status;

  // ── Which actions are available ──────────────────────────────────────────────
  const canSupApprove  = (role === 'supervisor' || role === 'gm') && status === 'draft';
  const canSupReject   = (role === 'supervisor' || role === 'gm') && status === 'draft';
  const canFinApprove  = (role === 'finance'    || role === 'gm') && status === 'supervisor_approved';
  const canFinReject   = (role === 'finance'    || role === 'gm') && status === 'supervisor_approved';
  const canGmRelease   =  role === 'gm'                           && status === 'finance_approved';

  const hasAnyAction = canSupApprove || canSupReject || canFinApprove || canFinReject || canGmRelease;

  const doAction = async (endpoint) => {
    setActing(true);
    setActionErr('');
    try {
      await api.patch(`/disbursements/${listId}/${endpoint}`);
      onAction();
      onClose();
    } catch (err) {
      setActionErr(err.response?.data?.error || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setActing(false); }
  };

  const doReject = async (notes) => {
    setActing(true);
    setActionErr('');
    try {
      const endpoint = role === 'finance' ? 'finance-reject' : 'reject';
      await api.patch(`/disbursements/${listId}/${endpoint}`, { notes });
      onAction();
      onClose();
    } catch (err) {
      setActionErr(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setActing(false);
      setShowReject(false);
    }
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" dir="rtl">

        {/* Header */}
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title">
              كشف الصرف — {MONTHS_AR[listInfo?.month]} {listInfo?.year}
            </h2>
            <div style={{ marginTop: '.4rem' }}>
              {listInfo && <StatusBadge status={listInfo.status} />}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        {/* Summary strip */}
        <div className="drawer-summary">
          <div className="sum-item">
            <span className="sum-val" style={{ color: '#10b981' }}>{included.length}</span>
            <span className="sum-lbl">مشمول</span>
          </div>
          <div className="sum-div" />
          <div className="sum-item">
            <span className="sum-val" style={{ color: '#ef4444' }}>{excluded.length}</span>
            <span className="sum-lbl">مستبعد</span>
          </div>
          <div className="sum-div" />
          <div className="sum-item">
            <span className="sum-val" style={{ color: '#1B5E8C', fontSize: '.9rem' }}>
              {formatAmount(total)}
            </span>
            <span className="sum-lbl">الإجمالي</span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ─────────────────────────────────────────── */}
        {hasAnyAction && (
          <div className="action-zone">
            <p className="action-zone-title">
              {role === 'supervisor' && '🔍 دورك: اعتماد أو رفض هذا الكشف'}
              {role === 'finance'    && '💰 دورك: التصديق المالي على هذا الكشف'}
              {role === 'gm'        && '🚀 دورك: إصدار الأموال للمناديب'}
            </p>

            <div className="action-btns">
              {/* Supervisor approve */}
              {canSupApprove && (
                <button
                  className="btn-approve"
                  onClick={() => doAction('approve')}
                  disabled={acting}
                >
                  {acting
                    ? <><span className="spin spin-w" />جارٍ الاعتماد…</>
                    : '✅ اعتماد الكشف'}
                </button>
              )}

              {/* Finance approve */}
              {canFinApprove && (
                <button
                  className="btn-approve"
                  onClick={() => doAction('finance-approve')}
                  disabled={acting}
                >
                  {acting
                    ? <><span className="spin spin-w" />جارٍ التصديق…</>
                    : '✅ تصديق مالي'}
                </button>
              )}

              {/* GM release */}
              {canGmRelease && (
                <button
                  className="btn-release"
                  onClick={() => doAction('release')}
                  disabled={acting}
                >
                  {acting
                    ? <><span className="spin spin-w" />جارٍ الإصدار…</>
                    : '🚀 إصدار الأموال'}
                </button>
              )}

              {/* Reject */}
              {(canSupReject || canFinReject) && (
                <button
                  className="btn-reject"
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                >
                  ✕ رفض الكشف
                </button>
              )}
            </div>

            {actionErr && (
              <div className="action-err">⚠ {actionErr}</div>
            )}
          </div>
        )}

        {/* No action info */}
        {!hasAnyAction && status && status !== 'released' && (
          <div className="no-action-info">
            <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
            <div>
              <strong>لا يوجد إجراء متاح لك</strong>
              <p>
                الحالة الحالية: <StatusBadge status={status} />
                {' '}· دورك: <strong>{role}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Rejection notes */}
        {listInfo?.rejection_notes && (
          <div className="rejection-box">
            <span>⚠</span>
            <div>
              <strong>سبب الرفض</strong>
              <p>{listInfo.rejection_notes}</p>
            </div>
          </div>
        )}

        {/* Items */}
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
              <div className="items-section-title">المشمولون ({included.length})</div>
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

        <div className="drawer-foot">
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
        .drawer {
          position:fixed; top:0; left:0; width:540px; max-width:96vw; height:100vh;
          background:#fff; z-index:50; display:flex; flex-direction:column;
          box-shadow:-4px 0 24px rgba(0,0,0,.12); animation:slideIn .25s ease;
          font-family:'Cairo','Tajawal',sans-serif;
        }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }

        .drawer-head {
          display:flex; align-items:flex-start; justify-content:space-between;
          padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; gap:1rem;
        }
        .drawer-title { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0; }
        .drawer-close {
          background:none; border:none; font-size:1.1rem; color:#9ca3af;
          cursor:pointer; padding:.25rem; flex-shrink:0;
        }

        .drawer-summary {
          display:flex; align-items:center; padding:1rem 1.5rem;
          background:#f8fafc; border-bottom:1px solid #e5eaf0; gap:1rem;
        }
        .sum-item { display:flex; flex-direction:column; align-items:center; gap:.2rem; flex:1; }
        .sum-val { font-size:1rem; font-weight:800; font-family:'Cairo',sans-serif; }
        .sum-lbl { font-size:.68rem; color:#94a3b8; font-weight:600; }
        .sum-div { width:1px; height:32px; background:#e5eaf0; flex-shrink:0; }

        /* ── ACTION ZONE ─────────────────────────────────────────────── */
        .action-zone {
          padding:1.25rem 1.5rem;
          background: linear-gradient(135deg, #f0f7ff 0%, #eff6ff 100%);
          border-bottom:2px solid #dbeafe;
        }
        .action-zone-title {
          font-size:.82rem; font-weight:700; color:#1d4ed8; margin:0 0 .85rem;
        }
        .action-btns { display:flex; gap:.65rem; flex-wrap:wrap; }

        .btn-approve {
          display:inline-flex; align-items:center; gap:.4rem;
          padding:.75rem 1.5rem;
          background:linear-gradient(135deg,#059669,#047857);
          color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700;
          border:none; border-radius:.75rem; cursor:pointer;
          box-shadow:0 3px 12px rgba(5,150,105,.35);
          transition:all .15s;
        }
        .btn-approve:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 18px rgba(5,150,105,.45); }
        .btn-approve:disabled { opacity:.6; cursor:not-allowed; }

        .btn-release {
          display:inline-flex; align-items:center; gap:.4rem;
          padding:.75rem 1.5rem;
          background:linear-gradient(135deg,#1B5E8C,#134569);
          color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700;
          border:none; border-radius:.75rem; cursor:pointer;
          box-shadow:0 3px 12px rgba(27,94,140,.35);
          transition:all .15s;
        }
        .btn-release:hover:not(:disabled) { transform:translateY(-1px); }
        .btn-release:disabled { opacity:.6; cursor:not-allowed; }

        .btn-reject {
          display:inline-flex; align-items:center; gap:.4rem;
          padding:.75rem 1.1rem;
          background:#fff; border:1.5px solid #fca5a5; color:#dc2626;
          font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700;
          border-radius:.75rem; cursor:pointer; transition:all .15s;
        }
        .btn-reject:hover:not(:disabled) { background:#fef2f2; }
        .btn-reject:disabled { opacity:.5; cursor:not-allowed; }

        .action-err {
          margin-top:.75rem; padding:.65rem .85rem;
          background:#fef2f2; border:1px solid #fecaca;
          border-radius:.5rem; font-size:.82rem; color:#b91c1c;
        }

        /* No action */
        .no-action-info {
          display:flex; gap:.75rem; align-items:flex-start;
          padding:1rem 1.5rem; background:#fffbeb; border-bottom:1px solid #fde68a;
          font-size:.82rem;
        }
        .no-action-info strong { display:block; color:#92400e; margin-bottom:.25rem; }
        .no-action-info p { color:#b45309; margin:0; display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }

        .rejection-box {
          display:flex; gap:.75rem; background:#fef2f2;
          border-bottom:1px solid #fecaca; padding:1rem 1.5rem;
        }
        .rejection-box span { font-size:1.1rem; flex-shrink:0; }
        .rejection-box strong { display:block; font-size:.85rem; color:#b91c1c; margin-bottom:.25rem; }
        .rejection-box p { font-size:.82rem; color:#dc2626; margin:0; line-height:1.5; }

        .drawer-body { flex:1; overflow-y:auto; padding:1rem 1.5rem; }
        .items-section-title {
          font-size:.75rem; font-weight:700; color:#6b7a8d;
          text-transform:uppercase; letter-spacing:.05em; margin:.5rem 0 .65rem;
        }
        .drawer-empty { display:flex; flex-direction:column; align-items:center; padding:3rem; gap:.5rem; text-align:center; }
        .drawer-empty p { font-size:.83rem; color:#94a3b8; margin:0; }

        .item-row { display:flex; align-items:center; gap:.75rem; padding:.6rem .4rem; border-bottom:1px solid #f8fafc; }
        .item-row:hover { background:#f8fbff; }
        .item-excluded { background:#fff8f8; }
        .item-avatar { width:34px; height:34px; border-radius:50%; background:#f0f4f8; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .item-info { flex:1; min-width:0; }
        .item-name { font-size:.83rem; font-weight:700; color:#1f2937; }
        .item-meta { display:flex; gap:.35rem; font-size:.7rem; color:#6b7a8d; flex-wrap:wrap; margin-top:.15rem; }
        .bio-tag { color:#10b981; font-weight:700; }
        .excl-reason { color:#ef4444; font-weight:600; }
        .item-amount { font-size:.83rem; font-weight:700; color:#1B5E8C; flex-shrink:0; }

        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        .skel-row { display:flex; align-items:center; gap:.75rem; padding:.6rem 0; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .drawer-foot { padding:1rem 1.5rem; border-top:1px solid #f0f4f8; display:flex; justify-content:flex-end; }
        .btn-ghost-sm { display:inline-flex; align-items:center; padding:.6rem 1.1rem; background:none; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.625rem; cursor:pointer; }
        .btn-ghost-sm:hover { background:#f0f7ff; }

        .spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(0,0,0,.2); border-top-color:currentColor; border-radius:50%; animation:spin .7s linear infinite; }
        .spin-w { border-color:rgba(255,255,255,.4); border-top-color:#fff; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DisbursementsPage() {
  // ✅ Read role fresh every render — never cache it outside the component
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [lists,      setLists]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [selected,   setSelected]   = useState(null); // selected list ID

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
    setError('');
    try {
      await api.post('/disbursements/generate');
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.error || 'فشل إنشاء الكشف');
    } finally { setGenerating(false); }
  };

  const selectedList = lists.find(l => l.id === selected);

  // Count lists that need THIS user's action
  const pendingCount = lists.filter(l =>
    (role === 'supervisor' && l.status === 'draft') ||
    (role === 'finance'    && l.status === 'supervisor_approved') ||
    (role === 'gm'         && l.status === 'finance_approved')
  ).length;

  // No auth — show message
  if (!user) {
    return (
      <AppShell>
        <div dir="rtl" style={{ textAlign: 'center', padding: '4rem', fontFamily: 'Cairo' }}>
          <p style={{ color: '#dc2626', fontWeight: 700 }}>
            ⚠ لم يتم التعرف على المستخدم. يرجى تسجيل الخروج وإعادة تسجيل الدخول.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">كشوف الصرف الشهري</h1>
            <p className="page-sub">
              {loading
                ? 'جارٍ التحميل…'
                : `${lists.length} كشف · دورك: ${role}`}
            </p>
          </div>
          {(role === 'supervisor' || role === 'gm') && (
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <><span className="spin spin-w" />جارٍ الإنشاء…</> : '+ إنشاء كشف هذا الشهر'}
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
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <div>
              <strong>
                لديك {pendingCount} {pendingCount === 1 ? 'كشف' : 'كشوف'} بانتظار إجراءك
              </strong>
              <p>اضغط على أي كشف مميّز بنقطة برتقالية لمراجعته واعتماده.</p>
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
            <p className="empty-sub">
              {role === 'supervisor' || role === 'gm'
                ? 'اضغط على "إنشاء كشف هذا الشهر" للبدء'
                : 'لم يتم إنشاء كشف لهذا الشهر بعد'}
            </p>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => {
                  const needsMyAction =
                    (role === 'supervisor' && list.status === 'draft') ||
                    (role === 'finance'    && list.status === 'supervisor_approved') ||
                    (role === 'gm'         && list.status === 'finance_approved');

                  return (
                    <tr
                      key={list.id}
                      className={`trow ${needsMyAction ? 'trow-urgent' : ''} ${selected === list.id ? 'trow-selected' : ''}`}
                      onClick={() => setSelected(list.id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(list.id)}
                    >
                      <td>
                        <div className="month-cell">
                          {needsMyAction && <span className="urgent-dot" title="يحتاج إجراءك" />}
                          <span className="month-badge">
                            {MONTHS_AR[list.month]} {list.year}
                          </span>
                        </div>
                      </td>
                      <td className="muted">
                        <span style={{ color: '#10b981', fontWeight: 700 }}>
                          {list.included_count}
                        </span>
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
                      <td>
                        <button
                          className={`action-btn ${needsMyAction ? 'action-btn-urgent' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setSelected(list.id); }}
                        >
                          {needsMyAction ? 'مراجعة واعتماد ←' : 'عرض ←'}
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
        .page {
          max-width:1100px; margin:0 auto; padding-bottom:4rem;
          font-family:'Cairo','Tajawal',sans-serif;
          display:flex; flex-direction:column; gap:1.25rem;
        }
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        .err-banner {
          display:flex; align-items:center; gap:.75rem;
          background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem;
          padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; font-weight:500;
        }
        .err-close { background:none; border:none; cursor:pointer; color:#b91c1c; margin-right:auto; }

        .alert-card {
          display:flex; align-items:flex-start; gap:.85rem;
          background:#fffbeb; border:1.5px solid #fde68a; border-radius:1rem;
          padding:1rem 1.25rem;
        }
        .alert-card strong { display:block; font-size:.9rem; font-weight:700; color:#92400e; margin-bottom:.25rem; }
        .alert-card p { font-size:.82rem; color:#b45309; margin:0; }

        .table-wrap {
          background:#fff; border:1px solid #e5eaf0; border-radius:1rem;
          overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05);
        }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th {
          padding:.8rem 1.1rem; text-align:right; font-size:.72rem;
          font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap;
        }
        .table td { padding:.85rem 1.1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow:last-child td { border-bottom:none; }
        .trow-urgent { background:#fffdf0; }
        .trow-urgent:hover { background:#fffbeb; }
        .trow-selected { background:#eff6ff !important; border-right:3px solid #1B5E8C; }

        .month-cell { display:flex; align-items:center; gap:.5rem; }
        .urgent-dot {
          width:9px; height:9px; border-radius:50%; background:#f59e0b; flex-shrink:0;
          animation:pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
        .month-badge { font-size:.85rem; font-weight:700; color:#0d3d5c; }
        .muted { color:#6b7a8d; }

        .action-btn {
          background:none; border:1.5px solid #e5eaf0; border-radius:.5rem;
          padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C;
          cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap;
        }
        .action-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }
        .action-btn-urgent {
          border-color:#f59e0b; color:#b45309; background:#fffbeb;
          font-weight:700;
        }
        .action-btn-urgent:hover { background:#fef3c7; }

        .skel {
          background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px;
        }
        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1.1rem; border-bottom:1px solid #f8fafc; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty {
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; min-height:300px; gap:.75rem; text-align:center;
          background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem;
        }
        .empty-title { font-size:1.05rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        .btn-primary {
          display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem;
          background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff;
          font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700;
          border:none; border-radius:.75rem; cursor:pointer;
          box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s;
        }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }

        .spin {
          display:inline-block; width:14px; height:14px;
          border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
          border-radius:50%; animation:spin .7s linear infinite;
        }
        .spin-w { border-color:rgba(255,255,255,.4); border-top-color:#fff; }
        @keyframes spin { to { transform:rotate(360deg); } }

        @media (max-width: 768px) {
          .page-top { flex-direction:column; }
          .table th:nth-child(5), .table td:nth-child(5) { display:none; }
        }
      `}</style>
    </AppShell>
  );
}