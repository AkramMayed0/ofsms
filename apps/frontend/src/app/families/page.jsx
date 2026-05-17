'use client';

/**
 * page.jsx
 * Route:  /families  (GM + Supervisor only)
 * Task:   feature/gm-families-page
 *
 * Full system-wide family management view for GM and Supervisor:
 *   - All families across all agents/governorates
 *   - Filter by status, governorate, search by name/head
 *   - Approve (→ under_marketing) or Reject with notes
 *   - Click row → slide-in detail drawer
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, X, Users, CheckCircle2, FileText, Check, Filter } from 'lucide-react';

import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  under_review: { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fffbeb' },
  under_marketing: { label: 'تحت التسويق', color: '#3b82f6', bg: '#eff6ff' },
  under_sponsorship: { label: 'تحت الكفالة', color: '#10b981', bg: '#ecfdf5' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: '#fef2f2' },
  inactive: { label: 'غير نشط', color: '#9ca3af', bg: '#f9fafb' },
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.inactive;
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

// ── RejectModal ────────────────────────────────────────────────────────────────

function RejectModal({ family, onConfirm, onClose, loading }) {
  const [notes, setNotes] = useState('');
  if (!family) return null;
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-box" dir="rtl">
        <div className="modal-head">
          <span className="modal-warn-icon"><AlertTriangle size={18} /></span>
          <div>
            <h3 className="modal-title">رفض تسجيل الأسرة</h3>
            <p className="modal-sub">{family.family_name}</p>
          </div>
        </div>
        <div className="modal-body">
          <label className="modal-lbl">سبب الرفض <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            className="modal-ta"
            rows={4}
            placeholder="اكتب سبب الرفض ليُرسَل للمندوب عبر الإشعارات…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
          />
          <p className="modal-hint">سيتلقى المندوب إشعاراً فورياً يتضمن هذا السبب.</p>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={loading}>إلغاء</button>
          <button
            className="btn-danger"
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={loading || !notes.trim()}
          >
            {loading ? <><span className="spin" />جارٍ الرفض…</> : 'تأكيد الرفض'}
          </button>
        </div>
      </div>
    </>
  );
}


// ── StatPill ───────────────────────────────────────────────────────────────────
function StatPill({ label, count, color }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '.6rem 1.1rem',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        fontFamily: "'Cairo', sans-serif",
        minWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color }}>
        {count}
      </span>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FamiliesManagementPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGov, setFilterGov] = useState('all');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFamilies = useCallback(() => {
    setLoading(true);
    api.get('/families')
      .then(({ data }) => setFamilies(data.families || []))
      .catch(() => setError('تعذّر تحميل بيانات الأسر.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

  // Filtering
  const filtered = families.filter((f) => {
    const matchSearch = !search ||
      f.family_name?.includes(search) ||
      f.head_of_family?.includes(search) ||
      f.agent_name?.includes(search);
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchGov = filterGov === 'all' || f.governorate_ar === filterGov;
    return matchSearch && matchStatus && matchGov;
  });

  const counts = families.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  const totalMembers = families
    .filter(f => f.status === 'under_sponsorship')
    .reduce((sum, f) => sum + (parseInt(f.member_count) || 0), 0);

  // Actions
  const handleApprove = async (family) => {
    setActioning('approve');
    try {
      await api.patch(`/families/${family.id}/status`, { status: 'under_marketing' });
      showToast(`تمت الموافقة على أسرة ${family.family_name}`);
      fetchFamilies();
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل الاعتماد', 'error');
    } finally {
      setActioning(null);
    }
  };

  const handleRejectConfirm = async (notes) => {
    if (!rejectTarget) return;
    setActioning('reject');
    try {
      await api.patch(`/families/${rejectTarget.id}/status`, { status: 'rejected', notes });
      showToast(`تم رفض تسجيل أسرة ${rejectTarget.family_name}`);
      fetchFamilies();
      setRejectTarget(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل الرفض', 'error');
    } finally {
      setActioning(null);
    }
  };

  const uniqueGovs = [...new Set(families.map(f => f.governorate_ar).filter(Boolean))];

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-err' : 'toast-ok'}`}>
            {toast.msg}
          </div>
        )}

        {/* Reject Modal */}
        <RejectModal
          family={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          loading={actioning === 'reject'}
        />

        {/* Page Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">إدارة الأسر المحتاجة</h1>
            <p className="page-sub">
              {loading
                ? 'جارٍ التحميل…'
                : `${families.length} أسرة · ${counts.under_review || 0} قيد المراجعة · ${totalMembers} فرد مكفول`}
            </p>
          </div>
          <button className="btn-primary" onClick={() => router.push('/families/new')}>
            + تسجيل أسرة جديدة
          </button>
        </div>

        {/* ── Stat pills ──────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <StatPill label="تحت الكفالة" count={counts.under_sponsorship || 0} color="#10B981" />
            <StatPill label="تحت التسويق" count={counts.under_marketing || 0} color="#3B82F6" />
            <StatPill label="قيد المراجعة" count={counts.under_review || 0} color="#F59E0B" />
            <StatPill label="الإجمالي" count={families.length} color="#1B5E8C" />
          </div>
        )}

        {/* ── Filters bar ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center',
          background: '#fff', border: '1px solid #e5eaf0', borderRadius: '0.875rem',
          padding: '0.875rem 1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', display: 'flex', pointerEvents: 'none',
            }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="ابحث باسم الأسرة أو المعيل أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.55rem 2.25rem 0.55rem 2rem',
                border: '1.5px solid #e5e7eb', borderRadius: '0.625rem',
                fontFamily: "'Cairo', sans-serif", fontSize: '0.875rem', color: '#1f2937',
                background: '#fafafa', outline: 'none', direction: 'rtl',
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#1B5E8C'; e.target.style.boxShadow = '0 0 0 3px rgba(27,94,140,.1)'; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none';                           e.target.style.background = '#fafafa'; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                  fontSize: '0.8rem', padding: '0.2rem', lineHeight: 1,
                }}
              ><X size={16} /></button>
            )}
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', display: 'flex', pointerEvents: 'none', zIndex: 1,
            }}>
              <Filter size={15} />
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.55rem 2.1rem 0.55rem 1.75rem',
                border: '1.5px solid #e5e7eb', borderRadius: '0.625rem',
                fontFamily: "'Cairo', sans-serif", fontSize: '0.82rem', color: '#374151',
                background: '#fafafa', outline: 'none', cursor: 'pointer',
                appearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left 0.6rem center',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = '#1B5E8C'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(STATUS_MAP).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Governorate filter */}
          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            style={{
              padding: '0.55rem 0.875rem 0.55rem 1.75rem',
              border: '1.5px solid #e5e7eb', borderRadius: '0.625rem',
              fontFamily: "'Cairo', sans-serif", fontSize: '0.82rem', color: '#374151',
              background: '#fafafa', outline: 'none', cursor: 'pointer',
              appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left 0.6rem center',
              transition: 'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#1B5E8C'}
            onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">جميع المحافظات</option>
            {uniqueGovs.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Clear filters */}
          {(search || filterStatus !== 'all' || filterGov !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterGov('all'); }}
              style={{
                padding: '0.5rem 0.875rem',
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.625rem',
                color: '#B91C1C', fontFamily: "'Cairo', sans-serif", fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.target.style.background = '#FEE2E2'}
              onMouseLeave={e => e.target.style.background = '#FEF2F2'}
            >
              مسح الفلاتر <X size={16} />
            </button>
          )}
        </div>

        {/* Error */}
        {error && <div className="err-banner"><AlertTriangle size={18} /> {error}</div>}

        {/* Skeleton */}
        {loading && (
          <div className="table-wrap">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skel-row">
                <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: '45%', height: 13, marginBottom: 6 }} />
                  <div className="skel" style={{ width: '30%', height: 11 }} />
                </div>
                <div className="skel" style={{ width: 90, height: 22, borderRadius: '2rem' }} />
                <div className="skel" style={{ width: 80, height: 13 }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: '3rem' }}><Users size={18} /></div>
            <h3 className="empty-title">
              {families.length === 0 ? 'لا توجد أسر مسجّلة بعد' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="empty-sub">
              {families.length === 0
                ? 'ابدأ بتسجيل أول أسرة'
                : 'جرّب تغيير معايير البحث أو الفلتر'}
            </p>
            {families.length === 0 && (
              <button className="btn-primary" onClick={() => router.push('/families/new')}>
                + تسجيل أسرة جديدة
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
                  <th>اسم الأسرة</th>
                  <th>المعيل / رب الأسرة</th>
                  <th>عدد الأفراد</th>
                  <th>المحافظة</th>
                  <th>الحالة</th>
                  <th>المندوب</th>
                  <th>الكافل</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    className="trow"
                    onClick={() => router.push(`/families/${f.id}`)}
                  >
                    <td>
                      <div className="name-cell">
                        <div className="avatar"><Users size={18} /></div>
                        <span className="name-text">{f.family_name}</span>
                      </div>
                    </td>
                    <td className="muted">{f.head_of_family || '—'}</td>
                    <td>
                      <span className="member-badge">{f.member_count || '—'} فرد</span>
                    </td>
                    <td className="muted">{f.governorate_ar || '—'}</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td className="muted">{f.agent_name || '—'}</td>
                    <td className="muted">{f.sponsor_name || '—'}</td>
                    <td className="muted">{fmtDate(f.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              عرض {filtered.length} من {families.length} أسرة ·
              إجمالي الأفراد في الكشف:{' '}
              {filtered.reduce((s, f) => s + (parseInt(f.member_count) || 0), 0)} فرد
            </div>
          </div>
        )}
      </div>


      <style jsx>{`
        .page { max-width:1200px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; position:relative; }

        .toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); z-index:200; padding:.75rem 1.5rem; border-radius:2rem; font-size:.88rem; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.15); white-space:nowrap; animation:toastIn .25s ease; }
        .toast-ok  { background:#0d3d5c; color:#fff; }
        .toast-err { background:#dc2626; color:#fff; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }

        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }



        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.85rem 1rem; border-radius:.75rem; font-size:.85rem; }

        .table-wrap { background:#fff; border:1px solid #e5eaf0; border-radius:1rem; overflow:hidden; box-shadow:0 1px 4px rgba(27,94,140,.05); }
        .table { width:100%; border-collapse:collapse; }
        .table thead tr { background:#f8fafc; }
        .table th { padding:.8rem 1rem; text-align:right; font-size:.72rem; font-weight:700; color:#6b7a8d; border-bottom:1px solid #e5eaf0; white-space:nowrap; }
        .table td { padding:.85rem 1rem; font-size:.83rem; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .trow { cursor:pointer; transition:background .12s; }
        .trow:hover { background:#f8fbff; }
        .trow-selected { background:#EFF6FF !important; border-right:3px solid #1B5E8C; }
        .trow:last-child td { border-bottom:none; }

        .name-cell { display:flex; align-items:center; gap:.65rem; }
        .avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#059669,#047857); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .name-text { font-weight:700; color:#1f2937; }
        .member-badge { display:inline-flex; align-items:center; padding:.2rem .6rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:2rem; font-size:.72rem; font-weight:700; color:#15803d; }
        .muted { color:#6b7a8d; }
        .table-footer { padding:.75rem 1rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; }

        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1rem; border-bottom:1px solid #f8fafc; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; white-space:nowrap; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }



        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:60; animation:fadeIn .2s ease; }
        .modal-box { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:min(460px,95vw); background:#fff; border-radius:1.25rem; z-index:61; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:popIn .2s ease; font-family:'Cairo','Tajawal',sans-serif; }
        @keyframes popIn { from{opacity:0;transform:translate(-50%,-47%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        .modal-head { display:flex; align-items:flex-start; gap:.85rem; padding:1.25rem 1.5rem; background:#fef2f2; border-bottom:1px solid #fecaca; border-radius:1.25rem 1.25rem 0 0; }
        .modal-warn-icon { font-size:1.4rem; flex-shrink:0; }
        .modal-title { font-size:1rem; font-weight:800; color:#b91c1c; margin:0 0 .15rem; }
        .modal-sub { font-size:.8rem; color:#dc2626; margin:0; }
        .modal-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.5rem; }
        .modal-lbl { font-size:.82rem; font-weight:600; color:#374151; }
        .modal-ta { width:100%; border:1.5px solid #e5eaf0; border-radius:.625rem; padding:.65rem .9rem; font-family:'Cairo',sans-serif; font-size:.88rem; resize:vertical; outline:none; box-sizing:border-box; transition:border-color .15s; }
        .modal-ta:focus { border-color:#dc2626; box-shadow:0 0 0 3px rgba(220,38,38,.1); }
        .modal-hint { font-size:.75rem; color:#9ca3af; margin:0; }
        .modal-foot { display:flex; gap:.75rem; justify-content:flex-end; padding:1rem 1.5rem; border-top:1px solid #f0f4f8; }
        .btn-ghost { padding:.65rem 1.25rem; background:none; border:1.5px solid #e5eaf0; border-radius:.75rem; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; color:#6b7280; cursor:pointer; }
        .btn-danger { display:inline-flex; align-items:center; gap:.4rem; padding:.65rem 1.4rem; background:#dc2626; color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; }
        .btn-danger:disabled { opacity:.65; cursor:not-allowed; }

        .spin { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        .spin-dark { border-color:rgba(5,150,105,.3); border-top-color:#047857; }
        @keyframes spin { to{transform:rotate(360deg)} }

        @media(max-width:768px){
          .page-top{flex-direction:column;}
          .table th:nth-child(6),.table td:nth-child(6),
          .table th:nth-child(7),.table td:nth-child(7),
          .table th:nth-child(8),.table td:nth-child(8){display:none;}
        }
      `}</style>
    </AppShell>
  );
}
