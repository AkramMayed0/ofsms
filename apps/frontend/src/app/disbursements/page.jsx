'use client';

/**
 * /disbursements/page.jsx
 * Route: /disbursements
 * Accessible by: supervisor, finance, gm
 *
 * Shows all disbursement lists (monthly cycles) with their status.
 * GMs and supervisors also see the "Generate This Month" button.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  draft:               { label: 'مسودة',                   color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' },
  supervisor_approved: { label: 'معتمد من المشرف',          color: '#3B82F6', bg: '#EFF6FF', dot: '#3B82F6' },
  finance_approved:    { label: 'معتمد من المالية',         color: '#8B5CF6', bg: '#F5F3FF', dot: '#8B5CF6' },
  released:            { label: 'مُحرَّر',                   color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
  rejected:            { label: 'مرفوض',                   color: '#EF4444', bg: '#FEF2F2', dot: '#EF4444' },
};

const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M16 12h.01"/><path d="M2 10h20"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: '#6B7280', bg: '#F3F4F6', dot: '#6B7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.75rem', borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: 600,
      color: s.color, background: s.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DisbursementsPage() {
  const { user } = useAuthStore();
  const [lists, setLists]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]       = useState('');

  const canGenerate = user?.role === 'gm' || user?.role === 'supervisor';

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/disbursements')
      .then(res => setLists(res.data.lists || []))
      .catch(err => setError(err.response?.data?.error || 'تعذّر تحميل كشوف الصرف'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenMsg('');
    try {
      const res = await api.post('/disbursements/generate');
      setGenMsg(`✅ ${res.data.message}`);
      load();
    } catch (err) {
      setGenMsg(`⚠ ${err.response?.data?.error || 'حدث خطأ أثناء التوليد'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">كشوف الصرف الشهري</h1>
            <p className="page-sub">متابعة دورات الصرف الشهري وحالة اعتمادها</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn-ghost" onClick={load} disabled={loading} title="تحديث">
              <IconRefresh />
            </button>
            {canGenerate && (
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <span className="spin" /> : <IconPlus />}
                توليد كشف هذا الشهر
              </button>
            )}
          </div>
        </div>

        {/* Generation message */}
        {genMsg && (
          <div className={`msg-banner ${genMsg.startsWith('✅') ? 'msg-ok' : 'msg-err'}`}>
            {genMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="msg-banner msg-err">⚠ {error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="skeleton-list">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && lists.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon"><IconWallet /></span>
            <h3>لا توجد كشوف صرف بعد</h3>
            <p>
              {canGenerate
                ? 'اضغط على "توليد كشف هذا الشهر" لإنشاء أول كشف صرف.'
                : 'لم يتم توليد أي كشف صرف حتى الآن. تواصل مع المشرف أو المدير العام.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && lists.length > 0 && (
          <div className="table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>الفترة</th>
                  <th>الحالة</th>
                  <th>إجمالي البنود</th>
                  <th>المبلغ الإجمالي</th>
                  <th>تاريخ الإنشاء</th>
                  <th>أُنشئ بواسطة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lists.map(list => (
                  <tr key={list.id}>
                    <td className="period-cell">
                      <span className="period-badge">
                        {ARABIC_MONTHS[list.month]} {list.year}
                      </span>
                    </td>
                    <td><StatusBadge status={list.status} /></td>
                    <td className="num-cell">{parseInt(list.total_items || 0).toLocaleString('ar-YE')}</td>
                    <td className="num-cell amount">
                      {parseFloat(list.total_amount || 0).toLocaleString('ar-YE', {
                        minimumFractionDigits: 0, maximumFractionDigits: 0,
                      })} ﷼
                    </td>
                    <td className="date-cell">
                      {new Date(list.created_at).toLocaleDateString('ar-YE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="creator-cell">{list.created_by_name || '—'}</td>
                    <td>
                      <Link href={`/disbursements/${list.id}`} className="view-btn">
                        عرض <IconArrow />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <style jsx>{`
        .page { max-width: 1100px; margin: 0 auto; font-family: 'Cairo','Tajawal',sans-serif; }

        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .page-title { font-size: 1.55rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub   { font-size: .82rem; color: #9ca3af; margin: 0; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: .45rem;
          padding: .65rem 1.25rem; background: linear-gradient(135deg,#1B5E8C,#134569);
          color: #fff; font-family: 'Cairo',sans-serif; font-size: .88rem; font-weight: 700;
          border: none; border-radius: .75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg,#2E7EB8,#1B5E8C); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem .9rem; background: none; color: #6b7280;
          font-family: 'Cairo',sans-serif; font-size: .85rem; font-weight: 600;
          border: 1.5px solid #e5e7eb; border-radius: .75rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost:hover:not(:disabled) { background: #f3f4f6; color: #1B5E8C; border-color: #d1d5db; }

        .msg-banner {
          padding: .8rem 1.1rem; border-radius: .75rem; font-size: .85rem; font-weight: 500;
          margin-bottom: 1rem;
        }
        .msg-ok  { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .msg-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

        .skeleton-list { display: flex; flex-direction: column; gap: .75rem; }
        .skeleton-row  {
          height: 56px; border-radius: .75rem;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 4rem 2rem; text-align: center; color: #6b7280;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem;
        }
        .empty-icon { font-size: 2.5rem; color: #d1d5db; margin-bottom: 1rem; display: flex; }
        .empty-state h3 { font-size: 1.1rem; font-weight: 700; color: #374151; margin: 0 0 .5rem; }
        .empty-state p  { font-size: .85rem; max-width: 360px; margin: 0; line-height: 1.7; }

        .table-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.05);
        }
        .table {
          width: 100%; border-collapse: collapse; font-size: .83rem;
        }
        .table th {
          text-align: right; padding: .85rem 1rem; font-size: .74rem; font-weight: 700;
          color: #9ca3af; background: #fafafa; border-bottom: 2px solid #f3f4f6;
          white-space: nowrap;
        }
        .table td { padding: .9rem 1rem; border-bottom: 1px solid #f3f4f6; color: #374151; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover td { background: #fafbff; }

        .period-badge {
          display: inline-block; padding: .25rem .75rem; border-radius: .5rem;
          background: #f0f7ff; color: #1B5E8C; font-weight: 700; font-size: .82rem;
        }
        .num-cell { text-align: center; font-variant-numeric: tabular-nums; }
        .amount   { color: #065f46; font-weight: 700; }
        .date-cell { color: #9ca3af; font-size: .78rem; white-space: nowrap; }
        .creator-cell { color: #6b7280; font-size: .8rem; }

        .view-btn {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .35rem .85rem; background: #f0f7ff; color: #1B5E8C;
          font-size: .78rem; font-weight: 700; border-radius: .5rem;
          text-decoration: none; transition: all .15s; font-family: 'Cairo',sans-serif;
          white-space: nowrap;
        }
        .view-btn:hover { background: #1B5E8C; color: #fff; }

        .spin {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .table-card { overflow-x: auto; }
          .page-header { flex-direction: column; }
        }
      `}</style>
    </AppShell>
  );
}
