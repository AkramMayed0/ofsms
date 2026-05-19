'use client';

/**
 * /disbursements/[id]/page.jsx
 * Route: /disbursements/:id
 * Accessible by: supervisor, finance, gm
 *
 * Shows full disbursement list detail with items table.
 * Role-aware action buttons:
 *   supervisor → Approve (draft) / Reject (draft)
 *   finance    → Approve (supervisor_approved) / Reject (supervisor_approved)
 *   gm         → Release (finance_approved) + can do supervisor/finance actions too
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { useRouter, useParams } from 'next/navigation';
import api from '../../../lib/api';
import AppShell from '../../../components/AppShell';
import useAuthStore from '../../../store/useAuthStore';

// ── Constants ─────────────────────────────────────────────────────────────────
const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const STATUS_CONFIG = {
  draft:               { label: 'مسودة — بانتظار اعتماد المشرف', color: '#F59E0B', bg: '#FEF3C7' },
  supervisor_approved: { label: 'معتمد من المشرف — بانتظار المالية', color: '#3B82F6', bg: '#EFF6FF' },
  finance_approved:    { label: 'معتمد من المالية — بانتظار المدير العام', color: '#8B5CF6', bg: '#F5F3FF' },
  released:            { label: 'مُحرَّر — تم الصرف', color: '#10B981', bg: '#ECFDF5' },
  rejected:            { label: 'مرفوض', color: '#EF4444', bg: '#FEF2F2' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 5 5 12 12 19"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconRelease = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// ── RejectModal ───────────────────────────────────────────────────────────────
function RejectModal({ onConfirm, onCancel, loading }) {
  const [notes, setNotes] = useState('');
  return (
    <div className="modal-overlay">
      <div className="modal-card" dir="rtl">
        <h3 className="modal-title">سبب الرفض</h3>
        <p className="modal-sub">يرجى توضيح سبب رفض كشف الصرف (مطلوب)</p>
        <textarea
          className="modal-textarea"
          rows={4}
          placeholder="أدخل ملاحظات الرفض هنا..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={loading}
        />
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>إلغاء</button>
          <button
            className="btn-danger"
            onClick={() => onConfirm(notes)}
            disabled={loading || !notes.trim()}
          >
            {loading ? <span className="spin" /> : <IconX />}
            تأكيد الرفض
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DisbursementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { user } = useAuthStore();

  const [list, setList]         = useState(null);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [acting, setActing]       = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [isActionOk, setIsActionOk] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const role = user?.role;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/disbursements/${id}`)
      .then(res => {
        const { items: fetchedItems, ...listData } = res.data;
        setList(listData);
        setItems(fetchedItems || []);
      })
      .catch(err => setError(err.response?.data?.error || 'تعذّر تحميل بيانات كشف الصرف'))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = async (endpoint, body = {}) => {
    setActing(true);
    setActionMsg('');
    try {
      const res = await api.patch(`/disbursements/${id}/${endpoint}`, body);
      setIsActionOk(true);
      setActionMsg(res.data.message);
      // Reload list
      const refresh = await api.get(`/disbursements/${id}`);
      const { items: refreshedItems, ...refreshedList } = refresh.data;
      setList(refreshedList);
      setItems(refreshedItems || []);
    } catch (err) {
      setIsActionOk(false);
      setActionMsg(err.response?.data?.error || 'حدث خطأ');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (notes) => {
    setShowReject(false);
    const endpoint = list.status === 'draft' ? 'reject' : 'finance-reject';
    await doAction(endpoint, { notes });
  };

  // Determine available actions based on role + status
  const canSupervisorApprove = (role === 'supervisor' || role === 'gm') && list?.status === 'draft';
  const canSupervisorReject  = (role === 'supervisor' || role === 'gm') && list?.status === 'draft';
  const canFinanceApprove    = (role === 'finance' || role === 'gm') && list?.status === 'supervisor_approved';
  const canFinanceReject     = (role === 'finance' || role === 'gm') && list?.status === 'supervisor_approved';
  const canGmRelease         = role === 'gm' && list?.status === 'finance_approved';

  const hasActions = canSupervisorApprove || canSupervisorReject || canFinanceApprove || canFinanceReject || canGmRelease;

  const totalIncluded = items.filter(i => i.included).reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalExcluded = items.filter(i => !i.included).length;

  if (loading) {
    return (
      <AppShell>
        <div className="page" dir="rtl">
          <div className="skeleton-header" />
          <div className="skeleton-body" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="page" dir="rtl">
          <button className="btn-ghost" onClick={() => router.push('/disbursements')}>
            <IconBack /> رجوع
          </button>
          <div className="msg-banner msg-err" style={{ marginTop: '1rem' }}><AlertTriangle size={18} /> {error}</div>
        </div>
      </AppShell>
    );
  }

  const statusInfo = STATUS_CONFIG[list?.status] || {};

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Reject modal */}
        {showReject && (
          <RejectModal
            onConfirm={handleReject}
            onCancel={() => setShowReject(false)}
            loading={acting}
          />
        )}

        {/* Back */}
        <button className="btn-ghost back-btn" onClick={() => router.push('/disbursements')}>
          <IconBack /> كشوف الصرف
        </button>

        {/* Title + status */}
        <div className="detail-header">
          <div>
            <h1 className="page-title">
              كشف صرف شهر {ARABIC_MONTHS[list?.month]} {list?.year}
            </h1>
            <p className="page-sub">أُنشئ بواسطة {list?.created_by_name || '—'}</p>
          </div>
          <span className="status-pill" style={{ color: statusInfo.color, background: statusInfo.bg }}>
            {statusInfo.label || list?.status}
          </span>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`msg-banner ${isActionOk ? 'msg-ok' : 'msg-err'}`}>
            {actionMsg}
          </div>
        )}

        {/* Summary cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-label">إجمالي البنود</span>
            <span className="summary-value">{items.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">مُدرَج للصرف</span>
            <span className="summary-value ok">{items.filter(i => i.included).length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">مستثنى</span>
            <span className="summary-value warn">{totalExcluded}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">المبلغ الإجمالي</span>
            <span className="summary-value money">
              {totalIncluded.toLocaleString('ar-YE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ﷼
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {hasActions && list?.status !== 'released' && list?.status !== 'rejected' && (
          <div className="action-bar">
            <span className="action-bar-label">الإجراءات المتاحة:</span>
            {(canSupervisorApprove || canFinanceApprove) && (
              <button
                className="btn-approve"
                onClick={() => doAction(canSupervisorApprove ? 'approve' : 'finance-approve')}
                disabled={acting}
              >
                {acting ? <span className="spin spin-dark" /> : <IconCheck />}
                {canSupervisorApprove ? 'اعتماد الكشف' : 'مصادقة المالية'}
              </button>
            )}
            {canGmRelease && (
              <button
                className="btn-release"
                onClick={() => doAction('release')}
                disabled={acting}
              >
                {acting ? <span className="spin" /> : <IconRelease />}
                إصدار أمر الصرف النهائي
              </button>
            )}
            {(canSupervisorReject || canFinanceReject) && (
              <button
                className="btn-reject"
                onClick={() => setShowReject(true)}
                disabled={acting}
              >
                <IconX />
                رفض الكشف
              </button>
            )}
          </div>
        )}

        {/* Rejection notes */}
        {list?.rejection_notes && (
          <div className="rejection-notice">
            <strong>سبب الرفض:</strong> {list.rejection_notes}
          </div>
        )}

        {/* Items table */}
        {items.length === 0 ? (
          <div className="empty-items">لا توجد بنود في هذا الكشف.</div>
        ) : (
          <div className="table-card">
            <div className="table-header-row">
              <h2 className="table-section-title">بنود الكشف ({items.length})</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المستفيد</th>
                    <th>الكافل</th>
                    <th>المندوب</th>
                    <th>المحافظة</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={!item.included ? 'row-excluded' : ''}>
                      <td className="idx-cell">{idx + 1}</td>
                      <td className="name-cell">{item.beneficiary_name || '—'}</td>
                      <td>{item.sponsor_name || '—'}</td>
                      <td>{item.agent_name || '—'}</td>
                      <td>{item.governorate_ar || '—'}</td>
                      <td className="amount-cell">
                        {parseFloat(item.amount).toLocaleString('ar-YE', {
                          minimumFractionDigits: 0, maximumFractionDigits: 0,
                        })} ﷼
                      </td>
                      <td>
                        {item.included ? (
                          <span className="badge-included">مُدرَج</span>
                        ) : (
                          <span className="badge-excluded" title={item.exclusion_reason || ''}>
                            مستثنى
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .page { max-width: 1100px; margin: 0 auto; font-family: 'Cairo','Tajawal',sans-serif; display: flex; flex-direction: column; gap: 1.25rem; }

        .back-btn { align-self: flex-start; margin-bottom: -.25rem; }

        .detail-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
        }
        .page-title { font-size: 1.5rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub   { font-size: .82rem; color: #9ca3af; margin: 0; }

        .status-pill {
          display: inline-block; padding: .4rem 1rem; border-radius: 999px;
          font-size: .8rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;
        }

        .msg-banner {
          padding: .8rem 1.1rem; border-radius: .75rem; font-size: .85rem; font-weight: 500;
        }
        .msg-ok  { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .msg-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

        .summary-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: .85rem;
        }
        @media(max-width:700px){ .summary-grid{ grid-template-columns: repeat(2,1fr); } }
        .summary-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: .875rem;
          padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .25rem;
        }
        .summary-label { font-size: .76rem; color: #9ca3af; font-weight: 600; }
        .summary-value { font-size: 1.55rem; font-weight: 800; color: #0d3d5c; line-height: 1; }
        .summary-value.ok    { color: #10B981; }
        .summary-value.warn  { color: #F59E0B; }
        .summary-value.money { color: #1B5E8C; font-size: 1.2rem; }

        .action-bar {
          display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
          background: #fff; border: 1px solid #e5e7eb; border-radius: .875rem;
          padding: .85rem 1.25rem;
        }
        .action-bar-label { font-size: .8rem; font-weight: 700; color: #6b7280; flex-shrink: 0; }

        .btn-approve {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.2rem; background: #ecfdf5; color: #065f46;
          border: 1.5px solid #a7f3d0; border-radius: .625rem;
          font-family: 'Cairo',sans-serif; font-size: .85rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-approve:hover:not(:disabled) { background: #10B981; color: #fff; border-color: #10B981; }
        .btn-approve:disabled { opacity: .6; cursor: not-allowed; }

        .btn-release {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.4rem; background: linear-gradient(135deg,#1B5E8C,#134569);
          color: #fff; border: none; border-radius: .625rem;
          font-family: 'Cairo',sans-serif; font-size: .88rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
          box-shadow: 0 2px 8px rgba(27,94,140,.25);
        }
        .btn-release:hover:not(:disabled) { background: linear-gradient(135deg,#2E7EB8,#1B5E8C); }
        .btn-release:disabled { opacity: .6; cursor: not-allowed; }

        .btn-reject {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.2rem; background: #fef2f2; color: #b91c1c;
          border: 1.5px solid #fecaca; border-radius: .625rem;
          font-family: 'Cairo',sans-serif; font-size: .85rem; font-weight: 700;
          cursor: pointer; transition: all .15s;
        }
        .btn-reject:hover:not(:disabled) { background: #EF4444; color: #fff; border-color: #EF4444; }
        .btn-reject:disabled { opacity: .6; cursor: not-allowed; }

        .rejection-notice {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .85rem 1.1rem; border-radius: .75rem; font-size: .84rem;
        }

        .table-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem;
          overflow: hidden;
        }
        .table-header-row {
          padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6;
        }
        .table-section-title { font-size: .9rem; font-weight: 700; color: #1B5E8C; margin: 0; }

        .table { width: 100%; border-collapse: collapse; font-size: .82rem; }
        .table th {
          text-align: right; padding: .75rem 1rem; font-size: .73rem; font-weight: 700;
          color: #9ca3af; background: #fafafa; border-bottom: 2px solid #f3f4f6;
          white-space: nowrap;
        }
        .table td { padding: .8rem 1rem; border-bottom: 1px solid #f3f4f6; color: #374151; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover td { background: #fafbff; }
        .row-excluded td { opacity: .55; }

        .idx-cell    { color: #d1d5db; font-size: .75rem; text-align: center; width: 2.5rem; }
        .name-cell   { font-weight: 700; color: #0d3d5c; }
        .amount-cell { font-weight: 700; color: #1B5E8C; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .badge-included {
          display: inline-block; padding: .18rem .6rem; border-radius: 999px;
          background: #ecfdf5; color: #065f46; font-size: .72rem; font-weight: 700;
        }
        .badge-excluded {
          display: inline-block; padding: .18rem .6rem; border-radius: 999px;
          background: #fef2f2; color: #b91c1c; font-size: .72rem; font-weight: 700;
          cursor: help;
        }

        .empty-items {
          text-align: center; padding: 2.5rem; color: #9ca3af; font-size: .85rem;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem;
        }

        /* Skeleton */
        .skeleton-header {
          height: 80px; border-radius: .875rem;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: .75rem;
        }
        .skeleton-body {
          height: 300px; border-radius: 1rem;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-card {
          background: #fff; border-radius: 1.1rem; padding: 2rem;
          width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }
        .modal-title { font-size: 1.1rem; font-weight: 800; color: #b91c1c; margin: 0 0 .35rem; }
        .modal-sub   { font-size: .82rem; color: #6b7280; margin: 0 0 1rem; }
        .modal-textarea {
          width: 100%; border: 1.5px solid #d1d5db; border-radius: .625rem;
          padding: .65rem .9rem; font-size: .88rem; font-family: 'Cairo',sans-serif;
          color: #1f2937; resize: vertical; outline: none; box-sizing: border-box;
          transition: border-color .15s;
        }
        .modal-textarea:focus { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
        .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1rem; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.1rem; background: none; color: #6b7280;
          font-family: 'Cairo',sans-serif; font-size: .85rem; font-weight: 600;
          border: 1.5px solid #e5e7eb; border-radius: .625rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost:hover:not(:disabled) { background: #f3f4f6; }

        .btn-danger {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.2rem; background: #EF4444; color: #fff;
          font-family: 'Cairo',sans-serif; font-size: .85rem; font-weight: 700;
          border: none; border-radius: .625rem; cursor: pointer; transition: all .15s;
        }
        .btn-danger:hover:not(:disabled) { background: #dc2626; }
        .btn-danger:disabled { opacity: .6; cursor: not-allowed; }

        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        .spin-dark { border-color: rgba(6,95,70,.3); border-top-color: #065f46; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
}
