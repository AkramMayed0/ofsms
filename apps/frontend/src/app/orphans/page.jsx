'use client';

/**
 * /orphans/page.jsx
 * Orphans list page — Agent sees only their own orphans, Supervisor/GM see all.
 *
 * Features:
 *   - Search by name
 *   - Filter by status, governorate, gifted flag
 *   - Clickable rows → /orphans/[id]
 *   - GM sees "نقل الكفالة" quick-action button on under_sponsorship rows
 *   - Agent sees "+ تسجيل يتيم" CTA
 *
 * API: GET /api/orphans?status=&governorateId=&isGifted=
 *      GET /api/governorates
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import TransferSponsorModal from '../../components/TransferSponsorModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  under_review:      { label: 'قيد المراجعة',  color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' },
  under_marketing:   { label: 'تحت التسويق',   color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6' },
  under_sponsorship: { label: 'تحت الكفالة',   color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
  rejected:          { label: 'مرفوض',         color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
  inactive:          { label: 'غير نشط',       color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const GENDER_LABELS = { male: 'ذكر', female: 'أنثى' };

const ALL_STATUSES = [
  { value: '', label: 'جميع الحالات' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'under_marketing', label: 'تحت التسويق' },
  { value: 'under_sponsorship', label: 'تحت الكفالة' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'inactive', label: 'غير نشط' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconTransfer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".3">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))}`;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  return (
    <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <span className="status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      {[40, 80, 50, 70, 90, 60, 50].map((w, i) => (
        <td key={i}><div className="skel-cell" style={{ width: `${w}%` }} /></td>
      ))}
    </tr>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, count, color, onClick, active }) {
  return (
    <button
      className={`stat-pill ${active ? 'stat-pill-active' : ''}`}
      style={{ '--pill-color': color }}
      onClick={onClick}
    >
      <span className="pill-count">{count}</span>
      <span className="pill-label">{label}</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OrphansListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isGM = user?.role === 'gm';
  const isSupervisor = user?.role === 'supervisor';
  const isAgent = user?.role === 'agent';

  const [orphans, setOrphans]           = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('');
  const [govFilter, setGov]             = useState('');
  const [giftedFilter, setGifted]       = useState('');

  // Transfer modal
  const [transferTarget, setTransferTarget] = useState(null); // { orphan }

  // Stats
  const stats = {
    total: orphans.length,
    under_review: orphans.filter(o => o.status === 'under_review').length,
    under_marketing: orphans.filter(o => o.status === 'under_marketing').length,
    under_sponsorship: orphans.filter(o => o.status === 'under_sponsorship').length,
  };

  // Load data
  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (govFilter)    params.append('governorateId', govFilter);
    if (giftedFilter) params.append('isGifted', giftedFilter);

    Promise.all([
      api.get(`/orphans?${params}`),
      api.get('/governorates'),
    ])
      .then(([orphansRes, govsRes]) => {
        setOrphans(orphansRes.data.orphans || []);
        setGovernorates(govsRes.data.data || []);
      })
      .catch(() => setError('تعذّر تحميل بيانات الأيتام'))
      .finally(() => setLoading(false));
  }, [statusFilter, govFilter, giftedFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(orphans);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      orphans.filter(
        (o) =>
          o.full_name?.toLowerCase().includes(q) ||
          o.guardian_name?.toLowerCase().includes(q) ||
          o.governorate_ar?.toLowerCase().includes(q)
      )
    );
  }, [search, orphans]);

  const handleRowClick = (orphan) => {
    router.push(`/orphans/${orphan.id}`);
  };

  const handleTransferClick = (e, orphan) => {
    e.stopPropagation(); // don't navigate
    setTransferTarget(orphan);
  };

  const handleTransferSuccess = () => {
    setTransferTarget(null);
    fetchData(); // refresh list
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setGov('');
    setGifted('');
  };

  const hasActiveFilters = search || statusFilter || govFilter || giftedFilter;

  return (
    <AppShell>
      <div className="orphans-page" dir="rtl">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {isAgent ? 'أيتامي' : 'الأيتام'}
            </h1>
            <p className="page-sub">
              {isAgent
                ? 'الأيتام المسجَّلون من قِبَلك'
                : 'جميع الأيتام المسجَّلين في النظام'}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchData} title="تحديث">
              <IconRefresh />
            </button>
            {(isAgent || isGM) && (
              <Link href="/orphans/new" className="btn-add">
                <IconPlus /> تسجيل يتيم جديد
              </Link>
            )}
          </div>
        </div>

        {/* ── Stat pills ──────────────────────────────────────────── */}
        <div className="stat-pills">
          <StatPill
            label="الإجمالي"
            count={stats.total}
            color="#1B5E8C"
            active={!statusFilter}
            onClick={() => setStatus('')}
          />
          <StatPill
            label="قيد المراجعة"
            count={stats.under_review}
            color="#F59E0B"
            active={statusFilter === 'under_review'}
            onClick={() => setStatus(s => s === 'under_review' ? '' : 'under_review')}
          />
          <StatPill
            label="تحت التسويق"
            count={stats.under_marketing}
            color="#3B82F6"
            active={statusFilter === 'under_marketing'}
            onClick={() => setStatus(s => s === 'under_marketing' ? '' : 'under_marketing')}
          />
          <StatPill
            label="تحت الكفالة"
            count={stats.under_sponsorship}
            color="#10B981"
            active={statusFilter === 'under_sponsorship'}
            onClick={() => setStatus(s => s === 'under_sponsorship' ? '' : 'under_sponsorship')}
          />
        </div>

        {/* ── Filters bar ─────────────────────────────────────────── */}
        <div className="filters-bar">
          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              className="search-inp"
              placeholder="ابحث بالاسم أو اسم الوصي أو المحافظة…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Status filter */}
          <div className="filter-select-wrap">
            <span className="filter-icon"><IconFilter /></span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Governorate filter */}
          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={govFilter}
              onChange={(e) => setGov(e.target.value)}
            >
              <option value="">جميع المحافظات</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Gifted filter — GM/supervisor only */}
          {(isGM || isSupervisor) && (
            <div className="filter-select-wrap">
              <select
                className="filter-select"
                value={giftedFilter}
                onChange={(e) => setGifted(e.target.value)}
              >
                <option value="">الكل (موهوب + عادي)</option>
                <option value="true">الموهوبون فقط ⭐</option>
                <option value="false">غير الموهوبين</option>
              </select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              مسح الفلاتر ✕
            </button>
          )}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠ {error}
            <button onClick={fetchData} className="retry-btn">إعادة المحاولة</button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="table-card">
          <div className="table-scroll">
            <table className="orphans-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>العمر</th>
                  <th>الجنس</th>
                  <th>المحافظة</th>
                  <th>الوصي</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                  {(isGM || isSupervisor) && <th>المندوب</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="empty-state">
                        <IconEmpty />
                        <p className="empty-title">
                          {hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا يوجد أيتام مسجَّلون بعد'}
                        </p>
                        <p className="empty-sub">
                          {hasActiveFilters
                            ? 'جرّب تغيير الفلاتر أو مسحها'
                            : isAgent
                              ? 'ابدأ بتسجيل أول يتيم'
                              : 'لم يُضَف أي يتيم إلى النظام'}
                        </p>
                        {hasActiveFilters && (
                          <button className="btn-clear-filters-sm" onClick={clearFilters}>
                            مسح الفلاتر
                          </button>
                        )}
                        {!hasActiveFilters && isAgent && (
                          <Link href="/orphans/new" className="btn-add-sm">
                            + تسجيل يتيم جديد
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((orphan) => (
                    <tr
                      key={orphan.id}
                      className="data-row"
                      onClick={() => handleRowClick(orphan)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleRowClick(orphan)}
                      role="button"
                      aria-label={`عرض تفاصيل ${orphan.full_name}`}
                    >
                      {/* Name */}
                      <td>
                        <div className="name-cell">
                          <div className="avatar-sm">
                            {orphan.full_name?.[0] || '؟'}
                          </div>
                          <div className="name-info">
                            <span className="name-text">
                              {orphan.full_name}
                              {orphan.is_gifted && (
                                <span className="gifted-tag" title="موهوب">
                                  <IconStar />
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td>
                        <span className="age-cell">{calcAge(orphan.date_of_birth)} سنة</span>
                      </td>

                      {/* Gender */}
                      <td>
                        <span className="gender-cell">
                          {GENDER_LABELS[orphan.gender] || '—'}
                        </span>
                      </td>

                      {/* Governorate */}
                      <td>
                        <span className="gov-cell">{orphan.governorate_ar || '—'}</span>
                      </td>

                      {/* Guardian */}
                      <td>
                        <span className="guardian-cell">{orphan.guardian_name || '—'}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={orphan.status} />
                      </td>

                      {/* Date */}
                      <td>
                        <span className="date-cell">{formatDate(orphan.created_at)}</span>
                      </td>

                      {/* Agent — supervisor/GM only */}
                      {(isGM || isSupervisor) && (
                        <td>
                          <span className="agent-cell">{orphan.agent_name || '—'}</span>
                        </td>
                      )}

                      {/* Actions */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="actions-cell">
                          {isGM && orphan.status === 'under_sponsorship' && (
                            <button
                              className="btn-transfer-row"
                              onClick={(e) => handleTransferClick(e, orphan)}
                              title="نقل الكفالة"
                            >
                              <IconTransfer />
                              <span>نقل</span>
                            </button>
                          )}
                          <button
                            className="btn-view-row"
                            onClick={() => handleRowClick(orphan)}
                            title="عرض التفاصيل"
                          >
                            <IconChevron />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span className="result-count">
                {filtered.length === orphans.length
                  ? `${orphans.length} يتيم`
                  : `${filtered.length} من أصل ${orphans.length} يتيم`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Transfer Modal ──────────────────────────────────────── */}
      {transferTarget && (
        <TransferSponsorModal
          isOpen={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          onSuccess={handleTransferSuccess}
          beneficiaryType="orphan"
          beneficiaryId={transferTarget.id}
          beneficiaryName={transferTarget.full_name}
          currentSponsor={transferTarget.sponsor_name}
          agentId={transferTarget.agent_id}
        />
      )}

      <style jsx>{`
        .orphans-page {
          max-width: 1100px; margin: 0 auto; padding-bottom: 3rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        /* ── Header ─────────────────────────────────────────────── */
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub   { font-size: .82rem; color: #9ca3af; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }

        .btn-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          background: #fff; color: #6b7280; cursor: pointer;
          transition: all .15s;
        }
        .btn-refresh:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        .btn-add {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .65rem 1.25rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border-radius: .75rem; text-decoration: none;
          font-size: .875rem; font-weight: 700;
          box-shadow: 0 2px 8px rgba(27,94,140,.25);
          transition: all .15s;
        }
        .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,94,140,.35); }

        /* ── Stat pills ─────────────────────────────────────────── */
        .stat-pills { display: flex; gap: .6rem; flex-wrap: wrap; }
        .stat-pill {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .45rem .9rem;
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 999px;
          font-family: 'Cairo', sans-serif; font-size: .78rem; font-weight: 600;
          color: #6b7280; cursor: pointer; transition: all .15s;
        }
        .stat-pill:hover { border-color: var(--pill-color); color: var(--pill-color); }
        .stat-pill-active {
          border-color: var(--pill-color);
          background: color-mix(in srgb, var(--pill-color) 10%, white);
          color: var(--pill-color);
        }
        .pill-count {
          background: var(--pill-color); color: #fff;
          border-radius: 999px; padding: .05rem .45rem;
          font-size: .7rem; font-weight: 700; min-width: 1.25rem; text-align: center;
        }
        .stat-pill:not(.stat-pill-active) .pill-count { background: #d1d5db; color: #374151; }

        /* ── Filters bar ────────────────────────────────────────── */
        .filters-bar {
          display: flex; gap: .65rem; flex-wrap: wrap; align-items: center;
          background: #fff; border: 1px solid #e5eaf0; border-radius: .875rem;
          padding: .875rem 1rem;
        }

        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none;
        }
        .search-inp {
          width: 100%; padding: .6rem .75rem .6rem 2.2rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .875rem; color: #1f2937;
          background: #fafafa; outline: none; box-sizing: border-box;
          direction: rtl; transition: border-color .15s, box-shadow .15s;
        }
        .search-inp::placeholder { color: #c4cdd8; }
        .search-inp:focus { border-color: #1B5E8C; box-shadow: 0 0 0 3px rgba(27,94,140,.1); background: #fff; }
        .search-clear {
          position: absolute; left: .6rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #9ca3af; cursor: pointer;
          font-size: .8rem; padding: .2rem;
          transition: color .12s;
        }
        .search-clear:hover { color: #374151; }

        .filter-select-wrap { position: relative; }
        .filter-icon {
          position: absolute; right: .65rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; display: flex; pointer-events: none; z-index: 1;
        }
        .filter-select {
          padding: .6rem 2rem .6rem .875rem;
          border: 1.5px solid #e5e7eb; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .82rem; color: #374151;
          background: #fafafa; outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left .6rem center;
          transition: border-color .15s;
        }
        .filter-select:focus { border-color: #1B5E8C; }

        .btn-clear-filters {
          padding: .5rem .875rem;
          background: #FEF2F2; border: 1px solid #FECACA; border-radius: .625rem;
          color: #B91C1C; font-family: 'Cairo', sans-serif; font-size: .78rem;
          font-weight: 600; cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .btn-clear-filters:hover { background: #FEE2E2; }

        /* ── Error ──────────────────────────────────────────────── */
        .error-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .75rem 1rem; border-radius: .75rem; font-size: .875rem;
        }
        .retry-btn {
          background: none; border: 1px solid #fca5a5; border-radius: .5rem;
          color: #b91c1c; padding: .3rem .75rem; cursor: pointer; font-size: .78rem;
          font-family: 'Cairo', sans-serif; font-weight: 600;
        }

        /* ── Table card ─────────────────────────────────────────── */
        .table-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .table-scroll { overflow-x: auto; }

        .orphans-table {
          width: 100%; border-collapse: collapse; font-size: .82rem;
          min-width: 700px;
        }

        .orphans-table thead tr {
          background: #f8fafc; border-bottom: 1.5px solid #e5eaf0;
        }
        .orphans-table th {
          padding: .75rem 1rem; font-size: .72rem; font-weight: 700;
          color: #9ca3af; text-align: right; white-space: nowrap;
          letter-spacing: .04em; text-transform: uppercase;
        }

        /* ── Data rows ──────────────────────────────────────────── */
        .data-row {
          border-bottom: 1px solid #f1f5f9; cursor: pointer;
          transition: background .12s;
        }
        .data-row:last-child { border-bottom: none; }
        .data-row:hover { background: #f8fbff; }
        .data-row:focus { outline: none; background: #f0f7ff; }
        .data-row td { padding: .875rem 1rem; vertical-align: middle; }

        /* ── Name cell ──────────────────────────────────────────── */
        .name-cell { display: flex; align-items: center; gap: .625rem; }
        .avatar-sm {
          width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-size: .78rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .name-info { display: flex; flex-direction: column; }
        .name-text {
          font-size: .875rem; font-weight: 700; color: #0d3d5c;
          display: flex; align-items: center; gap: .3rem;
        }
        .gifted-tag {
          color: #D97706; display: inline-flex; align-items: center;
          flex-shrink: 0;
        }

        /* ── Other cells ────────────────────────────────────────── */
        .age-cell      { font-weight: 600; color: #374151; }
        .gender-cell   { color: #374151; }
        .gov-cell      { color: #374151; }
        .guardian-cell { color: #6b7280; font-size: .8rem; }
        .agent-cell    { color: #6b7280; font-size: .78rem; }
        .date-cell     { color: #9ca3af; font-size: .75rem; white-space: nowrap; }

        /* ── Status badge ───────────────────────────────────────── */
        .status-badge {
          display: inline-flex; align-items: center; gap: .35rem;
          padding: .25rem .65rem; border-radius: 999px;
          font-size: .72rem; font-weight: 700; white-space: nowrap;
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── Actions cell ───────────────────────────────────────── */
        .actions-cell { display: flex; align-items: center; gap: .4rem; justify-content: flex-end; }

        .btn-transfer-row {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .35rem .65rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border: none; border-radius: .5rem;
          font-family: 'Cairo', sans-serif; font-size: .72rem; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(27,94,140,.25);
          transition: all .15s;
        }
        .btn-transfer-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(27,94,140,.35);
        }

        .btn-view-row {
          display: flex; align-items: center; justify-content: center;
          width: 1.75rem; height: 1.75rem; border-radius: .4rem;
          background: none; border: 1px solid #e5e7eb; color: #9ca3af;
          cursor: pointer; transition: all .12s;
        }
        .btn-view-row:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }

        /* ── Skeleton ───────────────────────────────────────────── */
        .skeleton-row td { padding: .875rem 1rem; }
        .skel-cell {
          height: 14px; border-radius: 4px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Empty state ────────────────────────────────────────── */
        .empty-state {
          display: flex; flex-direction: column; align-items: center; gap: .5rem;
          padding: 3.5rem 1rem; color: #9ca3af;
        }
        .empty-title { font-size: .95rem; font-weight: 700; color: #374151; margin: .25rem 0 0; }
        .empty-sub   { font-size: .82rem; margin: 0; }

        .btn-clear-filters-sm {
          margin-top: .5rem; padding: .5rem 1.25rem;
          background: none; border: 1.5px solid #d1d5db; border-radius: .625rem;
          color: #374151; font-family: 'Cairo', sans-serif; font-size: .82rem;
          font-weight: 600; cursor: pointer; transition: all .12s;
        }
        .btn-clear-filters-sm:hover { border-color: #1B5E8C; color: #1B5E8C; }

        .btn-add-sm {
          margin-top: .5rem; padding: .55rem 1.25rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; border-radius: .625rem; text-decoration: none;
          font-size: .82rem; font-weight: 700;
        }

        /* ── Table footer ───────────────────────────────────────── */
        .table-footer {
          padding: .75rem 1rem; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: flex-end;
        }
        .result-count { font-size: .75rem; color: #9ca3af; font-weight: 500; }

        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 640px) {
          .page-title { font-size: 1.3rem; }
          .filters-bar { gap: .5rem; }
          .search-wrap { min-width: 100%; }
        }
      `}</style>
    </AppShell>
  );
}
