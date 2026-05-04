'use client';

/**
 * page.jsx
 * Route:  /orphans  (GM + Supervisor only)
 * Task:   feature/gm-orphans-page
 *
 * Full system-wide orphan management view for GM and Supervisor:
 *   - All orphans across all agents/governorates
 *   - Filter by status, governorate, gifted flag, search by name
 *   - Approve (→ under_marketing) or Reject with notes
 *   - Click row → slide-in detail drawer
 *   - Export button (GM only)
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useAuthStore from '@/store/useAuthStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  under_review:       { label: 'قيد المراجعة',   color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' },
  under_marketing:    { label: 'تحت التسويق',     color: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6' },
  under_sponsorship:  { label: 'تحت الكفالة',     color: '#10b981', bg: '#ecfdf5', dot: '#10b981' },
  rejected:           { label: 'مرفوض',            color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
  inactive:           { label: 'غير نشط',          color: '#9ca3af', bg: '#f9fafb', dot: '#9ca3af' },
};

const GENDER_MAP = { male: 'ذكر', female: 'أنثى' };

const RELATION_MAP = {
  uncle: 'عم', maternal_uncle: 'خال', grandfather: 'جد',
  sibling: 'أخ / أخت', other: 'أخرى',
};

const ALL_STATUSES = Object.keys(STATUS_MAP);

// ── Helpers ────────────────────────────────────────────────────────────────────

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
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
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── RejectModal ────────────────────────────────────────────────────────────────

function RejectModal({ orphan, onConfirm, onClose, loading }) {
  const [notes, setNotes] = useState('');
  if (!orphan) return null;
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-box" dir="rtl">
        <div className="modal-head">
          <span className="modal-warn-icon">⚠</span>
          <div>
            <h3 className="modal-title">رفض تسجيل اليتيم</h3>
            <p className="modal-sub">{orphan.full_name}</p>
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

// ── DetailDrawer ───────────────────────────────────────────────────────────────

function DetailDrawer({ orphan, onClose, onApprove, onReject, actioning, role }) {
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDL] = useState(true);

  useEffect(() => {
    if (!orphan) return;
    setDL(true);
    api.get(`/orphans/${orphan.id}`)
      .then(({ data }) => setDocs(data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setDL(false));
  }, [orphan?.id]);

  if (!orphan) return null;

  const canApprove = orphan.status === 'under_review';
  const canReject = orphan.status === 'under_review';

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" dir="rtl">
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <div className="drawer-avatar">{orphan.full_name?.charAt(0) || '؟'}</div>
            <div>
              <h2 className="drawer-name">{orphan.full_name}</h2>
              <StatusBadge status={orphan.status} />
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="info-section">
            <h3 className="info-title">البيانات الأساسية</h3>
            <div className="info-grid">
              {[
                ['العمر', calcAge(orphan.date_of_birth)],
                ['الجنس', GENDER_MAP[orphan.gender] || '—'],
                ['المحافظة', orphan.governorate_ar || '—'],
                ['الوصي', orphan.guardian_name || '—'],
                ['صلة الوصي', RELATION_MAP[orphan.guardian_relation] || '—'],
                ['المندوب', orphan.agent_name || '—'],
                ['تاريخ التسجيل', fmtDate(orphan.created_at)],
              ].map(([l, v]) => (
                <div key={l} className="info-row">
                  <span className="info-label">{l}</span>
                  <span className="info-val">{v}</span>
                </div>
              ))}
              {orphan.is_gifted && (
                <div className="info-row">
                  <span className="info-label">موهوب</span>
                  <span className="info-val gifted-val">🌟 نعم</span>
                </div>
              )}
            </div>
          </div>

          {orphan.status === 'under_sponsorship' && orphan.sponsor_name && (
            <div className="info-section">
              <h3 className="info-title">بيانات الكفالة</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">الكافل</span>
                  <span className="info-val">{orphan.sponsor_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">المبلغ الشهري</span>
                  <span className="info-val">{orphan.monthly_amount ? `${Number(orphan.monthly_amount).toLocaleString()} ر.ي` : '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">بداية الكفالة</span>
                  <span className="info-val">{fmtDate(orphan.sponsorship_start)}</span>
                </div>
              </div>
            </div>
          )}

          {orphan.status === 'rejected' && orphan.notes && (
            <div className="rejection-box">
              <span>⚠</span>
              <div>
                <strong>سبب الرفض</strong>
                <p>{orphan.notes}</p>
              </div>
            </div>
          )}

          <div className="info-section">
            <h3 className="info-title">المستندات المرفوعة</h3>
            {docsLoading ? (
              <p className="muted-text">جارٍ التحميل…</p>
            ) : docs.length === 0 ? (
              <p className="muted-text">لا توجد مستندات</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {docs.map((d) => (
                  <div key={d.id} className="doc-chip">
                    <span>📄</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'left' }}>{d.original_name || d.doc_type}</span>
                    <span className="muted-text">{fmtDate(d.uploaded_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(canApprove || canReject) && (
          <div className="drawer-foot">
            {canApprove && (
              <button className="btn-approve" onClick={() => onApprove(orphan)} disabled={actioning}>
                {actioning === 'approve' ? <><span className="spin spin-dark" />جارٍ الاعتماد…</> : '✓ اعتماد التسجيل'}
              </button>
            )}
            {canReject && (
              <button className="btn-reject-outline" onClick={() => onReject(orphan)} disabled={!!actioning}>
                ✕ رفض
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function OrphansManagementPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const [orphans, setOrphans]         = useState([]);
  const [governorates, setGovs]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGov, setFilterGov]     = useState('all');
  const [filterGifted, setFilterGifted] = useState('all');
  const [selected, setSelected]       = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actioning, setActioning]     = useState(null);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrphans = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/orphans'),
      api.get('/governorates'),
    ])
      .then(([orphanRes, govRes]) => {
        setOrphans(orphanRes.data.orphans || []);
        setGovs(govRes.data.data || []);
      })
      .catch(() => setError('تعذّر تحميل بيانات الأيتام.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrphans(); }, [fetchOrphans]);

  // Filtering
  const filtered = orphans.filter((o) => {
    const matchSearch = !search ||
      o.full_name?.includes(search) ||
      o.guardian_name?.includes(search) ||
      o.agent_name?.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchGov = filterGov === 'all' || o.governorate_ar === filterGov;
    const matchGifted = filterGifted === 'all'
      ? true
      : filterGifted === 'yes' ? o.is_gifted : !o.is_gifted;
    return matchSearch && matchStatus && matchGov && matchGifted;
  });

  const counts = orphans.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Actions
  const handleApprove = async (orphan) => {
    setActioning('approve');
    try {
      await api.patch(`/orphans/${orphan.id}/status`, { status: 'under_marketing' });
      showToast(`✓ تمت الموافقة على ${orphan.full_name}`);
      fetchOrphans();
      setSelected(null);
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
      await api.patch(`/orphans/${rejectTarget.id}/status`, { status: 'rejected', notes });
      showToast(`تم رفض تسجيل ${rejectTarget.full_name}`);
      fetchOrphans();
      setRejectTarget(null);
      if (selected?.id === rejectTarget.id) setSelected(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'فشل الرفض', 'error');
    } finally {
      setActioning(null);
    }
  };

  const uniqueGovs = [...new Set(orphans.map(o => o.governorate_ar).filter(Boolean))];

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
          orphan={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          loading={actioning === 'reject'}
        />

        {/* Page Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">إدارة الأيتام</h1>
            <p className="page-sub">
              {loading ? 'جارٍ التحميل…' : `${orphans.length} يتيم · ${counts.under_review || 0} قيد المراجعة · ${counts.under_sponsorship || 0} مكفول`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.65rem' }}>
            {role === 'gm' && (
              <button className="btn-export" onClick={() => router.push('/marketing-pool')}>
                🤝 قائمة التسويق
              </button>
            )}
            <button className="btn-primary" onClick={() => router.push('/orphans/new')}>
              + تسجيل يتيم جديد
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="stats-row">
            {Object.entries(STATUS_MAP).map(([status, cfg]) => (
              <div
                key={status}
                className={`stat-chip ${filterStatus === status ? 'stat-chip-active' : ''}`}
                style={{ '--c': cfg.color, '--bg': cfg.bg }}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              >
                <span style={{ fontWeight: 800, color: cfg.color }}>{counts[status] || 0}</span>
                <span style={{ fontSize: '.72rem', color: cfg.color }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-inp"
              placeholder="ابحث بالاسم أو الوصي أو المندوب…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="filters-row">
            <select className="filter-sel" value={filterGov} onChange={(e) => setFilterGov(e.target.value)}>
              <option value="all">كل المحافظات</option>
              {uniqueGovs.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="filter-sel" value={filterGifted} onChange={(e) => setFilterGifted(e.target.value)}>
              <option value="all">الكل</option>
              <option value="yes">موهوبون فقط 🌟</option>
              <option value="no">غير موهوبين</option>
            </select>
            {(search || filterStatus !== 'all' || filterGov !== 'all' || filterGifted !== 'all') && (
              <button
                className="clear-filters"
                onClick={() => { setSearch(''); setFilterStatus('all'); setFilterGov('all'); setFilterGifted('all'); }}
              >
                ✕ مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div className="err-banner">⚠ {error}</div>}

        {/* Skeleton */}
        {loading && (
          <div className="table-wrap">
            {[1,2,3,4,5].map(i => (
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
            <div style={{ fontSize: '3rem' }}>👦</div>
            <h3 className="empty-title">
              {orphans.length === 0 ? 'لا يوجد أيتام مسجّلون بعد' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="empty-sub">
              {orphans.length === 0 ? 'ابدأ بتسجيل أول يتيم' : 'جرّب تغيير معايير البحث أو الفلتر'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>اليتيم</th>
                  <th>المحافظة</th>
                  <th>العمر / الجنس</th>
                  <th>الحالة</th>
                  <th>المندوب</th>
                  <th>الكافل</th>
                  <th>تاريخ التسجيل</th>
                  {(role === 'gm' || role === 'supervisor') && <th>إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className={`trow ${selected?.id === o.id ? 'trow-selected' : ''}`}
                    onClick={() => setSelected(selected?.id === o.id ? null : o)}
                  >
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{o.full_name?.charAt(0) || '؟'}</div>
                        <div>
                          <div className="name-text">{o.full_name}</div>
                          {o.is_gifted && <span className="gifted-tag">🌟 موهوب</span>}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{o.governorate_ar || '—'}</td>
                    <td className="muted">{calcAge(o.date_of_birth)} · {GENDER_MAP[o.gender] || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="muted">{o.agent_name || '—'}</td>
                    <td className="muted">{o.sponsor_name || '—'}</td>
                    <td className="muted">{fmtDate(o.created_at)}</td>
                    {(role === 'gm' || role === 'supervisor') && (
                      <td>
                        {o.status === 'under_review' && (
                          <div className="action-btns">
                            <button
                              className="act-approve"
                              onClick={(e) => { e.stopPropagation(); handleApprove(o); }}
                              disabled={!!actioning}
                              title="اعتماد"
                            >✅</button>
                            <button
                              className="act-reject"
                              onClick={(e) => { e.stopPropagation(); setRejectTarget(o); }}
                              disabled={!!actioning}
                              title="رفض"
                            >✕</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              عرض {filtered.length} من {orphans.length} يتيم
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <DetailDrawer
        orphan={selected ? orphans.find(o => o.id === selected.id) || selected : null}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={(o) => setRejectTarget(o)}
        actioning={actioning}
        role={role}
      />

      <style jsx>{`
        .page { max-width:1200px; margin:0 auto; padding-bottom:4rem; font-family:'Cairo','Tajawal',sans-serif; display:flex; flex-direction:column; gap:1.25rem; position:relative; }

        /* Toast */
        .toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); z-index:200; padding:.75rem 1.5rem; border-radius:2rem; font-size:.88rem; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.15); white-space:nowrap; animation:toastIn .25s ease; }
        .toast-ok  { background:#0d3d5c; color:#fff; }
        .toast-err { background:#dc2626; color:#fff; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }

        /* Header */
        .page-top { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .page-title { font-size:1.6rem; font-weight:800; color:#0d3d5c; margin:0 0 .2rem; }
        .page-sub { font-size:.85rem; color:#6b7a8d; margin:0; }

        /* Stats row */
        .stats-row { display:flex; gap:.5rem; flex-wrap:wrap; }
        .stat-chip { display:flex; align-items:center; gap:.4rem; padding:.35rem .85rem; background:var(--bg); border:1.5px solid transparent; border-radius:2rem; cursor:pointer; transition:all .15s; }
        .stat-chip:hover { border-color:var(--c); }
        .stat-chip-active { border-color:var(--c) !important; box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 15%,transparent); }

        /* Toolbar */
        .toolbar { display:flex; flex-direction:column; gap:.65rem; }
        .search-wrap { position:relative; display:flex; align-items:center; }
        .search-icon { position:absolute; right:.85rem; font-size:.9rem; pointer-events:none; }
        .search-inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.65rem .9rem .65rem 2.5rem; padding-right:2.4rem; font-size:.88rem; font-family:'Cairo',sans-serif; color:#1f2937; background:#fafafa; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; }
        .search-inp:focus { border-color:#1B5E8C; background:#fff; box-shadow:0 0 0 3px rgba(27,94,140,.1); }
        .search-clear { position:absolute; left:.75rem; background:none; border:none; cursor:pointer; color:#9ca3af; font-size:.85rem; }
        .filters-row { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
        .filter-sel { border:1.5px solid #e5eaf0; border-radius:.625rem; padding:.5rem .85rem; font-size:.82rem; font-family:'Cairo',sans-serif; color:#374151; background:#fff; outline:none; cursor:pointer; }
        .filter-sel:focus { border-color:#1B5E8C; }
        .clear-filters { background:none; border:1.5px solid #fca5a5; border-radius:.625rem; padding:.45rem .85rem; font-size:.78rem; font-weight:600; color:#dc2626; cursor:pointer; font-family:'Cairo',sans-serif; transition:all .15s; }
        .clear-filters:hover { background:#fef2f2; }

        /* Error */
        .err-banner { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:.85rem 1rem; border-radius:.75rem; font-size:.85rem; }

        /* Table */
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
        .avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:700; flex-shrink:0; }
        .name-text { font-weight:700; color:#1f2937; }
        .gifted-tag { display:inline-block; font-size:.65rem; font-weight:600; color:#f59e0b; background:#fffbeb; border:1px solid #fde68a; border-radius:2rem; padding:.1rem .4rem; margin-top:.1rem; }
        .muted { color:#6b7a8d; }
        .action-btns { display:flex; gap:.35rem; }
        .act-approve,.act-reject { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; cursor:pointer; transition:all .15s; border:1.5px solid; }
        .act-approve { background:#ecfdf5; border-color:#6ee7b7; color:#059669; }
        .act-approve:hover:not(:disabled) { background:#d1fae5; }
        .act-reject { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
        .act-reject:hover:not(:disabled) { background:#fee2e2; }
        .act-approve:disabled,.act-reject:disabled { opacity:.5; cursor:not-allowed; }
        .table-footer { padding:.75rem 1rem; font-size:.78rem; color:#9ca3af; border-top:1px solid #f0f4f8; }

        /* Skeleton */
        .skel-row { display:flex; align-items:center; gap:1rem; padding:.85rem 1rem; border-bottom:1px solid #f8fafc; }
        .skel { background:linear-gradient(90deg,#f0f4f8 25%,#e5eaf0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        /* Empty */
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:.75rem; text-align:center; background:#fff; border:1px solid #e5eaf0; border-radius:1rem; padding:2rem; }
        .empty-title { font-size:1rem; font-weight:700; color:#374151; margin:0; }
        .empty-sub { font-size:.85rem; color:#9ca3af; margin:0; }

        /* Buttons */
        .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.4rem; background:linear-gradient(135deg,#1B5E8C,#134569); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; box-shadow:0 2px 8px rgba(27,94,140,.25); transition:all .15s; white-space:nowrap; }
        .btn-primary:hover { background:linear-gradient(135deg,#2E7EB8,#1B5E8C); transform:translateY(-1px); }
        .btn-export { display:inline-flex; align-items:center; gap:.4rem; padding:.7rem 1.25rem; background:#fff; color:#1B5E8C; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:600; border:1.5px solid #dde5f0; border-radius:.75rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
        .btn-export:hover { background:#f0f7ff; border-color:#1B5E8C; }

        /* Drawer */
        .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:40; animation:fadeIn .2s ease; }
        .drawer { position:fixed; top:0; left:0; width:420px; max-width:95vw; height:100vh; background:#fff; z-index:50; display:flex; flex-direction:column; box-shadow:-4px 0 24px rgba(0,0,0,.12); animation:slideIn .25s ease; }
        @keyframes slideIn { from{transform:translateX(-100%)}to{transform:none} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .drawer-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f4f8; }
        .drawer-avatar { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#1B5E8C,#0d3d5c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.15rem; font-weight:700; flex-shrink:0; }
        .drawer-name { font-size:1.05rem; font-weight:800; color:#0d3d5c; margin:0 0 .4rem; }
        .drawer-close { background:none; border:none; font-size:1.1rem; color:#9ca3af; cursor:pointer; padding:.25rem .4rem; border-radius:6px; flex-shrink:0; }
        .drawer-close:hover { background:#f3f4f6; }
        .drawer-body { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
        .drawer-foot { display:flex; gap:.75rem; padding:1rem 1.5rem; border-top:1px solid #f0f4f8; }

        .info-section {}
        .info-title { font-size:.72rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; margin:0 0 .75rem; }
        .info-grid { display:flex; flex-direction:column; gap:.4rem; }
        .info-row { display:flex; justify-content:space-between; align-items:center; padding:.3rem 0; border-bottom:1px solid #f8fafc; }
        .info-label { font-size:.78rem; color:#6b7a8d; font-weight:500; }
        .info-val { font-size:.83rem; color:#1f2937; font-weight:600; }
        .gifted-val { color:#f59e0b; }
        .muted-text { font-size:.83rem; color:#94a3b8; margin:0; }
        .doc-chip { display:flex; align-items:center; gap:.5rem; padding:.45rem .65rem; background:#f8fafc; border:1px solid #e5eaf0; border-radius:.5rem; font-size:.78rem; }
        .rejection-box { display:flex; gap:.75rem; background:#fef2f2; border:1px solid #fecaca; border-radius:.75rem; padding:1rem; }
        .rejection-box span { font-size:1.1rem; flex-shrink:0; }
        .rejection-box strong { display:block; font-size:.85rem; color:#b91c1c; margin-bottom:.25rem; }
        .rejection-box p { font-size:.82rem; color:#dc2626; margin:0; line-height:1.6; }

        .btn-approve { flex:1; display:flex; align-items:center; justify-content:center; gap:.4rem; padding:.7rem; background:linear-gradient(135deg,#059669,#047857); color:#fff; font-family:'Cairo',sans-serif; font-size:.88rem; font-weight:700; border:none; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-approve:hover:not(:disabled) { transform:translateY(-1px); }
        .btn-approve:disabled { opacity:.6; cursor:not-allowed; }
        .btn-reject-outline { padding:.7rem 1.1rem; background:#fff; border:1.5px solid #fca5a5; color:#dc2626; font-family:'Cairo',sans-serif; font-size:.85rem; font-weight:700; border-radius:.75rem; cursor:pointer; transition:all .15s; }
        .btn-reject-outline:hover:not(:disabled) { background:#fef2f2; }
        .btn-reject-outline:disabled { opacity:.5; cursor:not-allowed; }

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
          .table th:nth-child(5),.table td:nth-child(5),
          .table th:nth-child(6),.table td:nth-child(6),
          .table th:nth-child(7),.table td:nth-child(7){display:none;}
        }
      `}</style>
    </AppShell>
  );
}
