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
import { AlertTriangle, X, User } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';
import EmptyState from '@/components/ui/EmptyState';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import StatusBadge from '@/components/ui/StatusBadge';
import Select from '@/components/ui/Select';

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
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconPlus = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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


const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const calcAge = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / MS_PER_YEAR)}`;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';



// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[40, 80, 50, 70, 90, 60, 50].map((w, i) => (
        <td key={i} className="p-3.5">
          <div className="animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] h-3.5 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, count, color }) {
  return (
    <div className="inline-flex flex-col items-center gap-0.5 px-4.5 py-2.5 bg-white border-[1.5px] border-gray-200 rounded-[12px] min-w-[80px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <span className="text-[1.35rem] font-extrabold leading-none" style={{ color }}>
        {count}
      </span>
      <span className="text-[0.72rem] font-semibold text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
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

  // Stats
  const stats = {
    total: orphans.length,
    under_review: orphans.filter(o => o.status === 'under_review').length,
    under_marketing: orphans.filter(o => o.status === 'under_marketing').length,
    under_sponsorship: orphans.filter(o => o.status === 'under_sponsorship').length,
  };

  // Load data — statusFilter is applied client-side so stats always reflect full counts
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (govFilter)    params.append('governorateId', govFilter);
    if (giftedFilter) params.append('isGifted', giftedFilter);

    try {
      const [orphansRes, govsRes] = await Promise.all([
        api.get(`/orphans?${params}`),
        api.get('/governorates'),
      ]);
      setOrphans(orphansRes.data.orphans || []);
      setGovernorates(govsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orphans data:', err);
      setError('تعذّر تحميل بيانات الأيتام');
    } finally {
      setLoading(false);
    }
  }, [govFilter, giftedFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side search + status filter
  useEffect(() => {
    let result = orphans;
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.full_name?.toLowerCase().includes(q) ||
          o.guardian_name?.toLowerCase().includes(q) ||
          o.governorate_ar?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, orphans]);

  const handleRowClick = (orphan) => {
    router.push(`/orphans/${orphan.id}`);
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
      <div className="max-w-[1100px] mx-auto pb-12 font-sans flex flex-col gap-5 px-4 md:px-0" dir="rtl">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-[#0d3d5c] mb-1">
              {isAgent ? 'أيتامي' : 'الأيتام'}
            </h1>
            <p className="text-[0.82rem] text-gray-400 m-0">
              {isAgent
                ? 'الأيتام المسجَّلون من قِبَلك'
                : 'جميع الأيتام المسجَّلين في النظام'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="flex items-center justify-center w-9 h-9 border-[1.5px] border-gray-200 rounded-[0.625rem] bg-white text-gray-500 cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary hover:bg-[#f0f7ff]" onClick={fetchData} title="تحديث">
              <IconRefresh />
            </button>
            {(isAgent || isGM) && (
              <Link
                href="/orphans/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline transition-all duration-180 hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-br from-primary to-primary-dark border-[1.5px] border-white/15 shadow-[0_4px_12px_rgba(27,94,140,0.35),0_1px_3px_rgba(0,0,0,0.15)] whitespace-nowrap"
              >
                <IconPlus /> تسجيل يتيم جديد
              </Link>
            )}
          </div>
        </div>

        {/* ── Stat pills ──────────────────────────────────────────── */}
        <div className="flex gap-2.5 flex-wrap">
          <StatPill label="الإجمالي"       count={stats.total}              color="#1B5E8C" />
          <StatPill label="قيد المراجعة"   count={stats.under_review}       color="#F59E0B" />
          <StatPill label="تحت التسويق"    count={stats.under_marketing}    color="#3B82F6" />
          <StatPill label="تحت الكفالة"    count={stats.under_sponsorship}    color="#10B981" />
        </div>

        {/* ── Filters bar ─────────────────────────────────────────── */}
        <div className="flex gap-2.5 flex-wrap items-center bg-white border border-[#e5eaf0] rounded-[0.875rem] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Search */}
          <SearchField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="ابحث بالاسم أو اسم الوصي أو المحافظة…"
            className="flex-1 min-w-[200px]"
            inputClassName="pl-9 pr-10 focus:ring-4 focus:ring-primary/10"
          />

          {/* Status filter */}
          <div className="relative">
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 flex pointer-events-none z-10">
              <IconFilter />
            </span>
            <Select
              className="py-2.5 pl-7 pr-8 border-gray-200 text-[0.82rem] text-gray-700 focus:ring-0"
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {/* Governorate filter */}
          <div className="relative">
            <Select
              className="py-2.5 pl-7 pr-8 border-gray-200 text-[0.82rem] text-gray-700 focus:ring-0"
              value={govFilter}
              onChange={(e) => setGov(e.target.value)}
            >
              <option value="">جميع المحافظات</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </Select>
          </div>

          {/* Gifted filter — GM/supervisor only */}
          {(isGM || isSupervisor) && (
            <div className="relative">
              <Select
                className="py-2.5 pl-7 pr-8 border-gray-200 text-[0.82rem] text-gray-700 focus:ring-0"
                value={giftedFilter}
                onChange={(e) => setGifted(e.target.value)}
              >
                <option value="">الكل (موهوب + عادي)</option>
                <option value="true">الموهوبون فقط ⭐</option>
                <option value="false">غير الموهوبين</option>
              </Select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-2 bg-red-50 border border-red-200 rounded-[0.625rem] text-[#B91C1C] text-[0.78rem] font-semibold cursor-pointer transition-colors duration-120 hover:bg-red-100 whitespace-nowrap"
            >
              مسح الفلاتر <X size={16} />
            </button>
          )}
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-[#b91c1c] px-4 py-3 rounded-[0.75rem] text-[0.875rem]" role="alert">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} /> {error}
            </div>
            <button onClick={fetchData} className="bg-transparent border border-red-300 rounded-[0.5rem] text-[#b91c1c] px-3 py-1 cursor-pointer text-[0.78rem] font-semibold">إعادة المحاولة</button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="bg-white border border-[#e5eaf0] rounded-[1rem] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.82rem] min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b-[1.5px] border-[#e5eaf0]">
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">الاسم</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">العمر</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">الجنس</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">المحافظة</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">الوصي</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">تاريخ التسجيل</th>
                  {(isGM || isSupervisor) && <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase">المندوب</th>}
                  <th className="px-4 py-3 text-right text-[0.72rem] font-bold text-gray-400 whitespace-nowrap tracking-wider uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <EmptyState
                        icon={
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".3">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        }
                        heading={hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا يوجد أيتام مسجَّلون بعد'}
                        description={hasActiveFilters ? 'جرّب تغيير الفلاتر أو مسحها' : isAgent ? 'ابدأ بتسجيل أول يتيم' : 'لم يُضَف أي يتيم إلى النظام'}
                        action={
                          hasActiveFilters
                            ? <button className="mt-2 px-5 py-2 bg-transparent border-[1.5px] border-gray-300 rounded-[0.625rem] text-gray-700 text-[0.82rem] font-semibold cursor-pointer transition-colors duration-120 hover:border-primary hover:text-primary" onClick={clearFilters}>مسح الفلاتر</button>
                            : (!hasActiveFilters && isAgent && <Link href="/orphans/new" className="mt-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[0.625rem] text-[0.82rem] font-bold shadow-[0_4px_12px_rgba(27,94,140,0.35)] hover:-translate-y-0.5 transition-all">+ تسجيل يتيم جديد</Link>)
                        }
                        className="py-14 px-4 gap-2"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((orphan) => (
                    <tr
                      key={orphan.id}
                      className="border-b border-slate-100 cursor-pointer transition-colors duration-120 hover:bg-[#f8fbff] focus:outline-none focus:bg-[#f0f7ff]"
                      onClick={() => handleRowClick(orphan)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleRowClick(orphan)}
                      role="button"
                      aria-label={`عرض تفاصيل ${orphan.full_name}`}
                    >
                      {/* Name */}
                      <td className="p-3.5 align-middle">
                        <div className="name-cell">
                          <div className="avatar-sm">
                            {orphan.full_name?.[0] || '؟'}
                          </div>
                          <div className="name-info">
                            <span className="name-text">
                              {orphan.full_name}
                              {orphan.is_gifted && (
                                <span className="text-amber-500 flex-shrink-0" title="موهوب">
                                  <IconStar />
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="p-3.5 align-middle">
                        <span className="font-semibold text-gray-700">{calcAge(orphan.date_of_birth)} سنة</span>
                      </td>

                      {/* Gender */}
                      <td className="p-3.5 align-middle">
                        <span className="text-gray-700">
                          {GENDER_LABELS[orphan.gender] || '—'}
                        </span>
                      </td>

                      {/* Governorate */}
                      <td className="p-3.5 align-middle">
                        <span className="text-gray-700">{orphan.governorate_ar || '—'}</span>
                      </td>

                      {/* Guardian */}
                      <td className="p-3.5 align-middle">
                        <span className="text-gray-500 text-[0.8rem]">{orphan.guardian_name || '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 align-middle">
                        <StatusBadge status={orphan.status} />
                      </td>

                      {/* Date */}
                      <td className="p-3.5 align-middle">
                        <span className="text-gray-400 text-[0.75rem] whitespace-nowrap">{formatDate(orphan.created_at)}</span>
                      </td>

                      {/* Agent — supervisor/GM only */}
                      {(isGM || isSupervisor) && (
                        <td className="p-3.5 align-middle">
                          <span className="text-gray-500 text-[0.78rem]">{orphan.agent_name || '—'}</span>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-3.5 align-middle">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button className="flex items-center justify-center w-7 h-7 rounded-[0.4rem] bg-transparent border border-gray-200 text-gray-400 cursor-pointer transition-all duration-120 hover:border-primary hover:text-primary hover:bg-[#f0f7ff]">
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
            <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
              <span className="text-[0.75rem] text-gray-400 font-medium">
                {filtered.length === orphans.length
                  ? `${orphans.length} يتيم`
                  : `${filtered.length} من أصل ${orphans.length} يتيم`}
              </span>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
