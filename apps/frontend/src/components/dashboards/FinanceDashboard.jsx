'use client';

/**
 * FinanceDashboard.jsx
 * Component: rendered inside /dashboard when role === 'finance'
 * API: GET /api/dashboard/finance  (we add this endpoint below)
 *
 * Focus: disbursement lists awaiting finance authorization,
 * financial flow summary, and authorization history.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' });
};

const formatAmount = (n) => {
  if (n == null) return '—';
  return `${Number(n).toLocaleString('ar-YE')} ر.ي`;
};

const daysUntil = (iso) => {
  const diff = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ── Status config ──────────────────────────────────────────────────────────────

const DISBURSE_STATUS = {
  draft:                { label: 'مسودة',             color: '#9ca3af', bg: '#f9fafb' },
  supervisor_approved:  { label: 'اعتمد المشرف',      color: '#f59e0b', bg: '#fffbeb' },
  finance_approved:     { label: 'اعتمد المالي',      color: '#3b82f6', bg: '#eff6ff' },
  released:             { label: 'تم الصرف',           color: '#10b981', bg: '#ecfdf5' },
  rejected:             { label: 'مرفوض',              color: '#ef4444', bg: '#fef2f2' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = '#1B5E8C', onClick, urgent }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', '--c': color,
        borderColor: urgent ? color : undefined,
        boxShadow: urgent ? `0 0 0 3px ${color}20` : undefined,
      }}
    >
      <div className="stat-icon" style={{ background: `${color}15`, color }}>{icon}</div>
      <div>
        <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = DISBURSE_STATUS[status] || DISBURSE_STATUS.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      padding: '.2rem .65rem', borderRadius: '2rem',
      fontSize: '.72rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}25`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Skel({ w, h, r }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r || 6 }} />;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FinanceDashboard() {
  const router  = useRouter();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/dashboard/finance')
      .then(({ data: res }) => setData(res))
      .catch(() => setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  const summary         = data?.summary              || {};
  const awaitingAuth    = data?.awaiting_finance_auth || [];
  const recentHistory   = data?.recent_history        || [];
  const disbDate        = data?.next_disbursement_date;
  const daysLeft        = disbDate ? daysUntil(disbDate) : null;

  const today = new Date().toLocaleDateString('ar-YE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="fin-dash" dir="rtl">

      {/* Header */}
      <div className="greeting">
        <div>
          <h1 className="greeting-title">لوحة القسم المالي</h1>
          <p className="greeting-sub">{today}</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/disbursements')}>
          إدارة الكشوف ←
        </button>
      </div>

      {error && <div className="err-banner">⚠ {error}</div>}

      {/* Stat cards */}
      <div className="stats-grid">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <Skel w={44} h={44} r={12} />
              <div style={{ flex: 1 }}>
                <Skel w={60} h={22} r={6} />
                <div style={{ marginTop: 6 }}><Skel w={90} h={12} r={4} /></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon="⏳" label="بانتظار تصديقك"
              value={awaitingAuth.length}
              sub="كشوف صرف اعتمدها المشرف"
              color="#f59e0b"
              urgent={awaitingAuth.length > 0}
              onClick={() => router.push('/disbursements')}
            />
            <StatCard
              icon="💰" label="إجمالي الشهر الحالي"
              value={formatAmount(summary.current_month_total)}
              sub={`${summary.current_month_count || 0} مستفيد`}
              color="#1B5E8C"
            />
            <StatCard
              icon="✅" label="تم صرفه هذا الشهر"
              value={formatAmount(summary.released_this_month)}
              sub="مُحرَّر ومُوزَّع"
              color="#10b981"
            />
            <StatCard
              icon="📅" label="موعد الصرف القادم"
              value={daysLeft !== null ? `${daysLeft} يوم` : '—'}
              sub={disbDate ? formatDate(disbDate) : ''}
              color={daysLeft !== null && daysLeft <= 3 ? '#ef4444' : '#059669'}
              urgent={daysLeft !== null && daysLeft <= 3}
            />
          </>
        )}
      </div>

      {/* Urgent authorization banner */}
      {!loading && awaitingAuth.length > 0 && (
        <div className="urgent-banner">
          <div className="urgent-icon">🔔</div>
          <div className="urgent-body">
            <strong>لديك {awaitingAuth.length} {awaitingAuth.length === 1 ? 'كشف صرف' : 'كشوف صرف'} بانتظار تصديقك</strong>
            <p>هذه الكشوف اعتمدها المشرف وتحتاج مصادقتك النهائية قبل إصدارها للمناديب.</p>
          </div>
          <button className="urgent-action" onClick={() => router.push('/disbursements')}>
            مراجعة الكشوف ←
          </button>
        </div>
      )}

      {/* Awaiting authorization table */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">كشوف الصرف بانتظار التصديق</h2>
          <button className="link-btn" onClick={() => router.push('/disbursements')}>
            عرض الكل →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '.5rem 0' }}>
                <Skel w={80} h={14} />
                <div style={{ flex: 1 }}><Skel w="40%" h={14} /></div>
                <Skel w={100} h={22} r="2rem" />
                <Skel w={90} h={32} r={8} />
              </div>
            ))}
          </div>
        ) : awaitingAuth.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem' }}>✅</span>
            <p>لا توجد كشوف بانتظار تصديقك</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>الشهر / السنة</th>
                <th>عدد المستفيدين</th>
                <th>إجمالي المبلغ</th>
                <th>تاريخ اعتماد المشرف</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {awaitingAuth.map((list) => (
                <tr key={list.id} className="trow" onClick={() => router.push('/disbursements')}>
                  <td>
                    <span className="month-badge">{list.month}/{list.year}</span>
                  </td>
                  <td className="muted">{list.beneficiary_count} مستفيد</td>
                  <td style={{ fontWeight: 700, color: '#1B5E8C' }}>{formatAmount(list.total_amount)}</td>
                  <td className="muted">{formatDate(list.supervisor_approved_at)}</td>
                  <td><StatusBadge status={list.status} /></td>
                  <td>
                    <button className="review-btn" onClick={(e) => { e.stopPropagation(); router.push('/disbursements'); }}>
                      مراجعة ←
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Two columns: monthly breakdown + recent history */}
      <div className="two-col">

        {/* Monthly financial breakdown */}
        <div className="card">
          <h2 className="card-title">ملخص الشهر الحالي</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {[1,2,3].map(i => <Skel key={i} w="100%" h={24} />)}
            </div>
          ) : (
            <>
              <div className="flow-item">
                <div className="flow-label">
                  <span className="flow-dot" style={{ background: '#1B5E8C' }} />
                  إجمالي الكشف
                </div>
                <span className="flow-amount" style={{ color: '#1B5E8C' }}>
                  {formatAmount(summary.current_month_total)}
                </span>
              </div>
              <div className="flow-bar-bg">
                <div className="flow-bar-fill" style={{
                  width: summary.current_month_total > 0
                    ? `${Math.round((summary.released_this_month / summary.current_month_total) * 100)}%`
                    : '0%',
                  background: '#10b981',
                }} />
              </div>
              <div className="flow-item" style={{ marginTop: '.65rem' }}>
                <div className="flow-label">
                  <span className="flow-dot" style={{ background: '#10b981' }} />
                  تم الصرف
                </div>
                <span className="flow-amount" style={{ color: '#10b981' }}>
                  {formatAmount(summary.released_this_month)}
                </span>
              </div>
              <div className="flow-item">
                <div className="flow-label">
                  <span className="flow-dot" style={{ background: '#f59e0b' }} />
                  معلّق
                </div>
                <span className="flow-amount" style={{ color: '#f59e0b' }}>
                  {formatAmount(summary.pending_this_month)}
                </span>
              </div>
              <div className="flow-divider" />
              <div className="flow-item">
                <div className="flow-label" style={{ fontWeight: 700, color: '#0d3d5c' }}>
                  عدد المستفيدين
                </div>
                <span style={{ fontWeight: 800, color: '#0d3d5c', fontSize: '1.1rem' }}>
                  {summary.current_month_count || 0}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Authorization history */}
        <div className="card">
          <h2 className="card-title">سجل الإصدارات الأخيرة</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem 0' }}>
                  <div>
                    <Skel w={80} h={13} />
                    <div style={{ marginTop: 5 }}><Skel w={60} h={11} /></div>
                  </div>
                  <Skel w={90} h={22} r="2rem" />
                </div>
              ))}
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: '2rem' }}>📂</span>
              <p>لا يوجد سجل إصدارات بعد</p>
            </div>
          ) : (
            <div className="history-list">
              {recentHistory.map((h) => (
                <div key={h.id} className="history-item">
                  <div>
                    <div className="history-period">{h.month}/{h.year}</div>
                    <div className="history-amount">{formatAmount(h.total_amount)}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <StatusBadge status={h.status} />
                    <div className="history-date">{formatDate(h.finance_approved_at || h.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="card-title">إجراءات سريعة</h2>
        <div className="actions-grid">
          {[
            { icon: '💰', label: 'مراجعة كشوف الصرف',   href: '/disbursements',          color: '#f59e0b' },
            { icon: '🗂️', label: 'سجل الإصدارات',        href: '/disbursements/history',  color: '#3b82f6' },
            { icon: '📄', label: 'تصدير التقارير',        href: '/reports',                color: '#059669' },
            { icon: '📊', label: 'التحليل المالي',        href: '/reports',                color: '#8b5cf6' },
          ].map(({ icon, label, href, color }) => (
            <button
              key={`${href}-${label}`}
              className="action-card"
              onClick={() => router.push(href)}
              style={{ '--ac': color }}
            >
              <span className="action-icon" style={{ background: `${color}15`, color }}>{icon}</span>
              <span className="action-label">{label}</span>
              <span className="action-arrow" style={{ color }}>←</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .fin-dash { display:flex; flex-direction:column; gap:1.75rem; font-family:'Cairo','Tajawal',sans-serif; }
        .greeting { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .greeting-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .greeting-sub { font-size:.82rem; color:#94a3b8; margin:0; }
        .err-banner { background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:.85rem 1rem; font-size:.85rem; color:#b91c1c; }

        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
        .stat-card { background:#fff; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.25rem; display:flex; align-items:flex-start; gap:.85rem; box-shadow:0 1px 4px rgba(27,94,140,.05); transition:all .15s; }
        .stat-card:hover { box-shadow:0 4px 16px rgba(27,94,140,.1); transform:translateY(-1px); }
        .stat-icon { width:44px; height:44px; border-radius:.75rem; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
        .stat-value { font-size:1.4rem; font-weight:800; line-height:1.1; margin-bottom:.2rem; font-family:'Cairo',sans-serif; }
        .stat-label { font-size:.78rem; font-weight:700; color:#374151; }
        .stat-sub { font-size:.72rem; color:#94a3b8; margin-top:.15rem; }

        .urgent-banner { display:flex; align-items:center; gap:1rem; background:#fffbeb; border:1.5px solid #fde68a; border-radius:1rem; padding:1.1rem 1.5rem; }
        .urgent-icon { font-size:1.5rem; flex-shrink:0; }
        .urgent-body { flex:1; }
        .urgent-body strong { display:block; font-size:.92rem; font-weight:700; color:#92400e; margin-bottom:.25rem; }
        .urgent-body p { font-size:.82rem; color:#b45309; margin:0; line-height:1.5; }
        .urgent-action { flex-shrink:0; display:inline-flex; align-items:center; padding:.6rem 1.1rem; background:#d97706; color:#fff; font-family:'Cairo',sans-serif; font-size:.82rem; font-weight:700; border:none; border-radius:.625rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .urgent-action:hover { background:#b45309; }

        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
        .card { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:1.5rem; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.1rem; }
        .card-title { font-size:.95rem; font-weight:800; color:#0d3d5c; margin:0 0 1.1rem; }

        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.7rem 1rem; text-align:right; font-size:.72rem; font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap; }
        .table td { padding:.8rem 1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow:last-child td { border-bottom:none; }
        .month-badge { display:inline-flex; align-items:center; padding:.25rem .65rem; background:#f0f7ff; border:1px solid #bfdbfe; border-radius:.5rem; font-size:.82rem; font-weight:700; color:#1d4ed8; }
        .muted { color:#6b7a8d; }
        .review-btn { background:none; border:1.5px solid #e5eaf0; border-radius:.5rem; padding:.3rem .7rem; font-size:.78rem; font-weight:600; color:#1B5E8C; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; white-space:nowrap; }
        .review-btn:hover { background:#f0f7ff; border-color:#1B5E8C; }

        .flow-item { display:flex; align-items:center; justify-content:space-between; padding:.35rem 0; }
        .flow-label { display:flex; align-items:center; gap:.5rem; font-size:.82rem; font-weight:600; color:#374151; }
        .flow-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .flow-amount { font-size:.88rem; font-weight:800; font-family:'Cairo',sans-serif; }
        .flow-bar-bg { height:8px; background:#f0f4f8; border-radius:4px; overflow:hidden; margin:.5rem 0; }
        .flow-bar-fill { height:100%; border-radius:4px; transition:width .5s ease; }
        .flow-divider { border-top:1px dashed #e5eaf0; margin:.65rem 0; }

        .history-list { display:flex; flex-direction:column; gap:.35rem; }
        .history-item { display:flex; align-items:center; justify-content:space-between; padding:.6rem .5rem; border-radius:.625rem; transition:background .12s; }
        .history-item:hover { background:#f8fbff; }
        .history-period { font-size:.85rem; font-weight:700; color:#1f2937; }
        .history-amount { font-size:.78rem; color:#6b7a8d; margin-top:.2rem; }
        .history-date { font-size:.7rem; color:#94a3b8; margin-top:.3rem; text-align:left; }

        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2.5rem; gap:.5rem; text-align:center; }
        .empty-state p { font-size:.83rem; color:#94a3b8; margin:0; font-weight:600; }

        .actions-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.85rem; margin-top:1rem; }
        .action-card { background:#f8fafc; border:1.5px solid #e5eaf0; border-radius:1rem; padding:1.1rem; display:flex; flex-direction:column; align-items:flex-start; gap:.6rem; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; }
        .action-card:hover { border-color:var(--ac); background:#fff; box-shadow:0 4px 16px rgba(0,0,0,.06); transform:translateY(-1px); }
        .action-icon { width:40px; height:40px; border-radius:.65rem; display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
        .action-label { font-size:.82rem; font-weight:700; color:#1f2937; }
        .action-arrow { font-size:.82rem; font-weight:700; align-self:flex-end; margin-top:auto; }

        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.9rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .link-btn { background:none; border:none; font-family:'Cairo',sans-serif; font-size:.78rem; font-weight:700; color:#1B5E8C; cursor:pointer; padding:0; }
        .link-btn:hover { opacity:.7; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns:repeat(2,1fr); }
          .two-col { grid-template-columns:1fr; }
          .actions-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 600px) {
          .greeting { flex-direction:column; align-items:flex-start; }
          .table th:nth-child(4), .table td:nth-child(4) { display:none; }
        }
      `}</style>
    </div>
  );
}
